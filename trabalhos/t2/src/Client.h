#pragma once
#include "LinkConnection.h"
#include "Timer.h"
#include <unistd.h>
#include <algorithm>

#define SLIDING_WINDOW_N 4
#define TIMEOUT 1000
#define MAX_TIMEOUTS 5

struct Connection {
    uint8_t address;
    uint8_t sentFrame;
    uint8_t receivedFrame;
    std::vector<uint8_t> receivedMessage;
};

class Client
{
public:
    Client(const std::string& path, uint8_t address)
    {
        physicalConnection = std::make_unique<PhysicalConnection>(PhysicalConnection::Connect(path));
        linkConnection = std::make_shared<LinkConnection>(std::move(physicalConnection));
        this->address = address;
    }

    void receive()
    {
        Frame frame;
        std::string finalMessage;

        while (true)
        {
            try
            {
                linkConnection->Receive(frame);
            }
            catch (const std::runtime_error& e)
            {
                std::cerr << "An error ocurred while receiving frame: " << e.what() << std::endl;
                break;
            }
            if (frame.DestinationAddress != address)
                continue;

            int conindex = findConnection(frame.SourceAddress);
            if (conindex == -1)
                conindex = openConnection(frame.SourceAddress);

            if (frame.ACK == 1) {
                activeConnections[conindex].sentFrame++;
            } else if (frame.ID == activeConnections[conindex].receivedFrame) {
                if (frame.Length != 0) {
                    for (int i = 0; i < frame.Length; i++)
                        activeConnections[conindex].receivedMessage.push_back(frame.Payload[i]);
                } else {
                    std::vector<uint8_t> message = activeConnections[conindex].receivedMessage;
                    finalMessage.assign(message.begin(), message.end());
                    activeConnections[conindex].receivedMessage.clear();
                }
                activeConnections[conindex].receivedFrame++;
                Frame ackFrame = makeFrame(frame.ID, 0, 0, frame.SourceAddress, "", 1);
                std::cout << "Sending ACK Frame..." << std::endl;
                linkConnection->Send(ackFrame);
            } else {
                continue;
            }

            std::cout << "Received frame." << std::endl;
            std::cout << frame << std::endl;
            std::cout << std::endl;

            if (frame.Length == 0 && frame.ACK == 0)
                std::cout << "Received message: " << finalMessage << std::endl;
        }
    }

    void sendMessage(std::string line, uint8_t destAddress)
    {
        timeout = 0;
        int conindex = findConnection(destAddress);
        if (conindex == -1)
            conindex = openConnection(destAddress);
        int str_pos = 0;
        int frame_size = (int)line.size();
        int id = activeConnections[conindex].sentFrame;
        int init_id = id;
        int sent_id = id;
        int finalized = 0;
        while (frame_size > 0 && id < init_id + SLIDING_WINDOW_N) { // inicializa frame buffer
            Frame frame = makeFrame(id, str_pos, frame_size, destAddress, line);
            frameBuffer.push_back(frame);
            str_pos += FRAME_PAYLOAD_SIZE;
            frame_size -= FRAME_PAYLOAD_SIZE;
            id++;
        }
        do {
            for (int i = 0; i < std::min(SLIDING_WINDOW_N, (int)frameBuffer.size()); i++) {
                std::cout << "Sending frame..." << std::endl;
                std::cout << frameBuffer[i] << std::endl;
                std::cout << std::endl;
           
                linkConnection->Send(frameBuffer[i]);
            }
            sent_id = activeConnections[conindex].sentFrame;
            timer.start();
            float elapsedTime = 0;
            while (elapsedTime < TIMEOUT && sent_id != id) {
                elapsedTime = timer.update();
                sent_id = activeConnections[conindex].sentFrame;
            }
            if (elapsedTime >= TIMEOUT)
                timeout++;
            else
                timeout = 0;
            while (init_id < sent_id) {
                frameBuffer.erase(frameBuffer.begin());
                init_id++;
                if (frame_size > 0) {
                    Frame frame = makeFrame(id, str_pos, frame_size, destAddress, line);
                    frameBuffer.push_back(frame);
                    str_pos += FRAME_PAYLOAD_SIZE;
                    frame_size -= FRAME_PAYLOAD_SIZE;
                    id++;
                } else if (finalized == 0) { // envia mensagem final
                    Frame frame = makeFrame(id, 0, 0, destAddress, "");
                    frameBuffer.push_back(frame);
                    id++;
                    finalized = 1;
                }
            }
        } while (frameBuffer.size() != 0 && timeout < MAX_TIMEOUTS);
        frameBuffer.clear();

        if (timeout < MAX_TIMEOUTS) {
            std::cout << "Finished sending message: " << line << std::endl;
        }
        else
            std::cout << "Gave up sending message: " << line << std::endl;
    }

    void run()
    {
        std::thread thread(
            [this]()
            {
                this->receive();
            }
        );
        std::string line;
        while (std::getline(std::cin, line)) {
            if (line.empty())
                continue;
            
            size_t pos = line.find(" ");
            std::string command = line.substr(0, pos);
            line.erase(0, pos + 1);
            
            if (!command.compare("send")) {
                size_t pos = line.find(" ");
                uint8_t destAddress = 0;
                try {
                    destAddress = std::stoi(line.substr(0, pos));
                } catch (const std::exception& e) {
                    std::cerr << "Invalid address: " << e.what() << std::endl;
                    continue;
                }
                line.erase(0, pos + 1);
                sendMessage(line, destAddress);
            } else {
                std::cout << "Invalid command\n";
            }
        }
    }

private:
    uint8_t address;
    std::unique_ptr<PhysicalConnection> physicalConnection;
    std::shared_ptr<LinkConnection> linkConnection;
    std::vector<struct Connection> activeConnections;
    std::vector<Frame> frameBuffer;
    Timer timer;
    int timeout;

    int findConnection(uint8_t address)
    {
        int i;
        for (i = 0; i < activeConnections.size(); i++) {
            if (activeConnections[i].address == address)
                return i;
        }
        return -1;
    }

    int openConnection(uint8_t address)
    {
        struct Connection c;
        c.address = address;
        c.sentFrame = 0;
        c.receivedFrame = 0;
        activeConnections.push_back(c);
        return (int)activeConnections.size() - 1;
    }
    
    Frame makeFrame(int id, int str_pos, int frame_size, int destAddress, std::string line, int ack = 0)
    {
        Frame frame;
        frame.DestinationAddress = destAddress;
        frame.SourceAddress = address;
        frame.Length = std::clamp(frame_size, 0, FRAME_PAYLOAD_SIZE);
        frame.ID = id;
        frame.ACK = ack;
        std::memcpy(frame.Payload, &(line.data()[str_pos]), frame.Length);
        return frame;
    }
};
