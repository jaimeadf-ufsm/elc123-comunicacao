#pragma once
#include "LinkConnection.h"
#include "Timer.h"
#include "ErrorSimulator.h"
#include "CRC.h"
#include <unistd.h>
#include <algorithm>
#include <sstream>
#include <iomanip>
#include <mutex>

#define SLIDING_WINDOW_N 4
#define TIMEOUT 1000
#define MAX_TIMEOUTS 5

struct Connection
{
    uint8_t address;
    uint8_t sentFrame;
    uint8_t receivedFrame;
    std::vector<uint8_t> receivedMessage;
};

class Client
{
public:
    Client(const std::string &path, uint8_t address)
    {
        physicalConnection = std::make_unique<PhysicalConnection>(PhysicalConnection::Connect(path));
        linkConnection = std::make_shared<LinkConnection>(std::move(physicalConnection));
        errorSimulator = std::make_unique<ErrorSimulator>();
        this->address = address;
    }

    void receive()
    {
        Frame frame;
        std::string finalMessage;

        std::cout << "[DEBUG] Client " << static_cast<int>(address) << " starting receive loop" << std::endl;

        while (true)
        {
            try
            {
                linkConnection->Receive(frame);
            }
            catch (const std::runtime_error &e)
            {
                std::cerr << "An error ocurred while receiving frame: " << e.what() << std::endl;
                break;
            }

            std::cout << "[DEBUG] Client " << static_cast<int>(address)
                      << " received frame for destination " << static_cast<int>(frame.DestinationAddress) << std::endl;

            if (frame.DestinationAddress != address)
            {
                std::cout << "[DEBUG] Frame not for this client, ignoring" << std::endl;
                continue;
            }

            int conindex = findConnection(frame.SourceAddress);
            if (conindex == -1)
                conindex = openConnection(frame.SourceAddress);

            if (frame.IsCorrupted)
            {
                std::cout << "Frame corrupted (CRC error) - discarding and not sending ACK (Go-Back-N will handle retransmission)" << std::endl;
                std::cout << "Expected frame ID: " << static_cast<int>(activeConnections[conindex].receivedFrame) << std::endl;
                continue;
            }

            if (frame.ACK == 1)
            {
                std::lock_guard<std::mutex> lock(connectionsMutex);
                activeConnections[conindex].sentFrame++;
            }
            else if (frame.ID == activeConnections[conindex].receivedFrame)
            {
                if (frame.Length != 0)
                {
                    for (int i = 0; i < frame.Length; i++)
                        activeConnections[conindex].receivedMessage.push_back(frame.Payload[i]);
                }
                else
                {
                    std::vector<uint8_t> message = activeConnections[conindex].receivedMessage;
                    finalMessage.assign(message.begin(), message.end());
                    activeConnections[conindex].receivedMessage.clear();
                }
                activeConnections[conindex].receivedFrame++;

                if (errorSimulator->shouldSendAck())
                {
                    Frame ackFrame = makeFrame(frame.ID, 0, 0, frame.SourceAddress, "", 1);
                    std::cout << "Sending ACK Frame..." << std::endl;
                    linkConnection->Send(ackFrame);
                }
                else
                {
                    std::cout << "ACK disabled by error simulator - not sending ACK" << std::endl;
                }
            }
            else
            {
                std::cout << "Out-of-order frame received. Expected ID: " << static_cast<int>(activeConnections[conindex].receivedFrame)
                          << ", Received ID: " << static_cast<int>(frame.ID) << std::endl;

                if (frame.ID < activeConnections[conindex].receivedFrame)
                {
                    if (errorSimulator->shouldSendAck() && activeConnections[conindex].receivedFrame > 0)
                    {
                        Frame ackFrame = makeFrame(activeConnections[conindex].receivedFrame - 1, 0, 0, frame.SourceAddress, "", 1);
                        std::cout << "Sending duplicate ACK for frame ID: " << static_cast<int>(activeConnections[conindex].receivedFrame - 1) << std::endl;
                        linkConnection->Send(ackFrame);
                    }
                }
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
        frameBuffer.clear();

        timeout = 0;
        int conindex = findConnection(destAddress);
        if (conindex == -1)
            conindex = openConnection(destAddress);
        int str_pos = 0;
        int frame_size = (int)line.size();

        int id, init_id, sent_id;
        {
            std::lock_guard<std::mutex> lock(connectionsMutex);
            id = activeConnections[conindex].sentFrame;
            init_id = id;
            sent_id = id;
        }

        int finalized = 0;
        while (frame_size > 0 && id != init_id + SLIDING_WINDOW_N)
        { // inicializa frame buffer
            Frame frame = makeFrame(id, str_pos, frame_size, destAddress, line);
            frameBuffer.push_back(frame);
            str_pos += FRAME_PAYLOAD_SIZE;
            frame_size -= FRAME_PAYLOAD_SIZE;
            id++;
        }
        do
        {
            for (int i = 0; i < std::min(SLIDING_WINDOW_N, (int)frameBuffer.size()); i++)
            {
                Frame frameToSend = frameBuffer[i];

                // apply error simulation before sending
                if (errorSimulator->shouldDropFrame())
                {
                    std::cout << "Frame dropped by error simulator" << std::endl;
                    continue;
                }

                errorSimulator->corruptFrame(frameToSend);

                std::cout << "Sending frame..." << std::endl;
                std::cout << frameToSend << std::endl;
                std::cout << std::endl;

                linkConnection->Send(frameToSend);
            }
            {
                std::lock_guard<std::mutex> lock(connectionsMutex);
                sent_id = activeConnections[conindex].sentFrame;
            }
            timer.start();
            float elapsedTime = 0;
            while (elapsedTime < TIMEOUT && sent_id != id)
            {
                elapsedTime = timer.update();
                {
                    std::lock_guard<std::mutex> lock(connectionsMutex);
                    sent_id = activeConnections[conindex].sentFrame;
                }
            }
            if (elapsedTime >= TIMEOUT)
                timeout++;
            else
                timeout = 0;
            while (init_id < sent_id)
            {
                frameBuffer.erase(frameBuffer.begin());
                init_id++;
                if (frame_size > 0)
                {
                    Frame frame = makeFrame(id, str_pos, frame_size, destAddress, line);
                    frameBuffer.push_back(frame);
                    str_pos += FRAME_PAYLOAD_SIZE;
                    frame_size -= FRAME_PAYLOAD_SIZE;
                    id++;
                }
                else if (finalized == 0)
                { // envia mensagem final
                    Frame frame = makeFrame(id, 0, 0, destAddress, "");
                    frameBuffer.push_back(frame);
                    id++;
                    finalized = 1;
                }
            }
        } while (frameBuffer.size() != 0 && timeout < MAX_TIMEOUTS);
        frameBuffer.clear();

        if (timeout < MAX_TIMEOUTS)
        {
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
            });

        printHelp();

        std::string line;
        while (std::getline(std::cin, line))
        {
            if (line.empty())
                continue;

            std::istringstream iss(line);
            std::string command;
            iss >> command;

            if (command == "send")
            {
                handleSendCommand(iss);
            }
            else if (command == "corrupted_bits")
            {
                handleCorruptedBitsCommand(iss);
            }
            else if (command == "corrupted_range")
            {
                handleCorruptedRangeCommand(iss);
            }
            else if (command == "corrupted_probability")
            {
                handleCorruptedProbabilityCommand(iss);
            }
            else if (command == "lost_frames")
            {
                handleLostFramesCommand(iss);
            }
            else if (command == "disable_ack")
            {
                errorSimulator->setAckEnabled(false);
                std::cout << "ACK disabled" << std::endl;
            }
            else if (command == "enable_ack")
            {
                errorSimulator->setAckEnabled(true);
                std::cout << "ACK enabled" << std::endl;
            }
            else if (command == "show_connection")
            {
                handleShowConnectionCommand(iss);
            }
            else if (command == "show_errors")
            {
                errorSimulator->printStatus();
            }
            else if (command == "reset_errors")
            {
                errorSimulator->resetErrors();
                std::cout << "Error simulation reset" << std::endl;
            }
            else if (command == "help")
            {
                printHelp();
            }
            else
            {
                std::cout << "Invalid command. Type 'help' for available commands." << std::endl;
            }
        }
    }

private:
    uint8_t address;
    std::unique_ptr<PhysicalConnection> physicalConnection;
    std::shared_ptr<LinkConnection> linkConnection;
    std::unique_ptr<ErrorSimulator> errorSimulator;
    std::vector<struct Connection> activeConnections;
    std::vector<Frame> frameBuffer;
    Timer timer;
    int timeout;
    std::mutex connectionsMutex;

    int findConnection(uint8_t address)
    {
        for (size_t i = 0; i < activeConnections.size(); i++)
        {
            if (activeConnections[i].address == address)
                return static_cast<int>(i);
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

        std::memset(frame.Payload, 0, FRAME_PAYLOAD_SIZE);

        if (frame.Length > 0 && str_pos < static_cast<int>(line.size()))
        {
            int copy_size = std::min(static_cast<int>(frame.Length), static_cast<int>(line.size()) - str_pos);
            std::memcpy(frame.Payload, line.data() + str_pos, copy_size);
        }

        std::cout << "[DEBUG] makeFrame: destAddress=" << static_cast<int>(destAddress)
                  << ", frame.DestinationAddress=" << static_cast<int>(frame.DestinationAddress) << std::endl;

        // calculate CRC for the frame data (header + payload)
        uint8_t frameData[FRAME_HEADER_SIZE + FRAME_PAYLOAD_SIZE];
        frameData[0] = frame.DestinationAddress;
        frameData[1] = frame.SourceAddress;
        frameData[2] = frame.Length;
        frameData[3] = frame.ID;
        frameData[4] = frame.ACK;
        std::memcpy(frameData + FRAME_HEADER_SIZE, frame.Payload, frame.Length);

        frame.CRC = crc32(frameData, FRAME_HEADER_SIZE + frame.Length);

        return frame;
    }

    void printHelp() const
    {
        std::cout << "\n=== Available Commands ===" << std::endl;
        std::cout << "send <address> <message>                    - Send message to address" << std::endl;
        std::cout << "corrupted_bits <n>                          - Set number of bits to corrupt" << std::endl;
        std::cout << "corrupted_range <start> <end>               - Set bit range for corruption" << std::endl;
        std::cout << "corrupted_probability <0.0-1.0>             - Set corruption probability" << std::endl;
        std::cout << "lost_frames <0.0-1.0>                       - Set frame loss probability" << std::endl;
        std::cout << "disable_ack                                 - Disable ACK sending" << std::endl;
        std::cout << "enable_ack                                  - Enable ACK sending" << std::endl;
        std::cout << "show_connection <address>                   - Show connection status" << std::endl;
        std::cout << "show_errors                                 - Show error simulator status" << std::endl;
        std::cout << "reset_errors                                - Reset all error settings" << std::endl;
        std::cout << "help                                        - Show this help" << std::endl;
        std::cout << "=========================" << std::endl;
    }

    void handleSendCommand(std::istringstream &iss)
    {
        int destAddressInt;
        std::string message;

        if (!(iss >> destAddressInt) || destAddressInt < 0 || destAddressInt > 255)
        {
            std::cerr << "Usage: send <address> <message> (address must be 0-255)" << std::endl;
            return;
        }

        uint8_t destAddress = static_cast<uint8_t>(destAddressInt);

        std::cout << "[DEBUG] handleSendCommand: destAddress read as " << static_cast<int>(destAddress) << std::endl;

        std::getline(iss, message);
        if (!message.empty() && message[0] == ' ')
        {
            message = message.substr(1); // remove leading space
        }

        if (message.empty())
        {
            std::cerr << "Message cannot be empty" << std::endl;
            return;
        }

        std::cout << "[DEBUG] handleSendCommand: calling sendMessage with destAddress=" << static_cast<int>(destAddress) << std::endl;
        sendMessage(message, destAddress);
    }

    void handleCorruptedBitsCommand(std::istringstream &iss)
    {
        int bits;
        if (!(iss >> bits) || bits < 0)
        {
            std::cerr << "Usage: corrupted_bits <n> (n >= 0)" << std::endl;
            return;
        }

        errorSimulator->setCorruptedBits(bits);
        std::cout << "Corrupted bits set to: " << bits << std::endl;
    }

    void handleCorruptedRangeCommand(std::istringstream &iss)
    {
        int start, end;
        if (!(iss >> start >> end) || start < 0 || end < start)
        {
            std::cerr << "Usage: corrupted_range <start> <end> (start >= 0, end >= start)" << std::endl;
            return;
        }

        errorSimulator->setCorruptedRange(start, end);
        std::cout << "Corrupted range set to: [" << start << ", " << end << "]" << std::endl;
    }

    void handleCorruptedProbabilityCommand(std::istringstream &iss)
    {
        double prob;
        if (!(iss >> prob) || prob < 0.0 || prob > 1.0)
        {
            std::cerr << "Usage: corrupted_probability <0.0-1.0>" << std::endl;
            return;
        }

        errorSimulator->setCorruptedProbability(prob);
        std::cout << "Corruption probability set to: " << std::fixed << std::setprecision(3) << prob << std::endl;
    }

    void handleLostFramesCommand(std::istringstream &iss)
    {
        double prob;
        if (!(iss >> prob) || prob < 0.0 || prob > 1.0)
        {
            std::cerr << "Usage: lost_frames <0.0-1.0>" << std::endl;
            return;
        }

        errorSimulator->setLostFrameProbability(prob);
        std::cout << "Frame loss probability set to: " << std::fixed << std::setprecision(3) << prob << std::endl;
    }

    void handleShowConnectionCommand(std::istringstream &iss)
    {
        int targetAddressInt;
        if (!(iss >> targetAddressInt) || targetAddressInt < 0 || targetAddressInt > 255)
        {
            std::cerr << "Usage: show_connection <address> (address must be 0-255)" << std::endl;
            return;
        }

        uint8_t targetAddress = static_cast<uint8_t>(targetAddressInt);

        int conindex = findConnection(targetAddress);
        if (conindex == -1)
        {
            std::cout << "No active connection to address " << static_cast<int>(targetAddress) << std::endl;
            return;
        }

        const Connection &conn = activeConnections[conindex];
        std::cout << "=== Connection Status ===" << std::endl;
        std::cout << "Address: " << static_cast<int>(conn.address) << std::endl;
        std::cout << "Sent frames: " << static_cast<int>(conn.sentFrame) << std::endl;
        std::cout << "Received frames: " << static_cast<int>(conn.receivedFrame) << std::endl;
        std::cout << "Buffered message bytes: " << conn.receivedMessage.size() << std::endl;
        std::cout << "========================" << std::endl;
    }
};
