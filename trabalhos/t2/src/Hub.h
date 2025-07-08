#pragma once

#include <string>
#include <memory>
#include <thread>
#include <mutex>
#include <algorithm>
#include <iostream>
#include <sstream>
#include <iomanip>
#include <ctime>
#include <cstdlib>

#include <unistd.h>
#include <sys/socket.h>
#include <sys/un.h>

#include "LinkConnection.h"

enum class HubControl
{
    Automatic,
    Manual
};

class Hub
{
public:
    Hub(const std::string &path, HubControl mode = HubControl::Automatic) : m_Path(path), m_DemoMode(mode)
    {
    }

    void Run()
    {
        int sfd = socket(AF_UNIX, SOCK_STREAM, 0);

        if (sfd < 0)
            throw std::runtime_error("Unable to create unix socket: " + std::string(strerror(errno)));

        struct sockaddr_un addr;
        std::memset(&addr, 0, sizeof(addr));

        addr.sun_family = AF_UNIX;
        std::strncpy(addr.sun_path, m_Path.c_str(), sizeof(addr.sun_path) - 1);

        if (unlink(m_Path.c_str()) < 0 && errno != ENOENT)
        {
            close(sfd);
            throw std::runtime_error("Unable to unlink unix socket file: " + std::string(strerror(errno)));
        }

        if (bind(sfd, (struct sockaddr *)&addr, sizeof(addr)) < 0)
        {
            close(sfd);
            throw std::runtime_error("Unable to bind unix socket: " + std::string(strerror(errno)));
        }

        if (listen(sfd, 5) < 0)
        {
            close(sfd);
            throw std::runtime_error("Unable to listen on unix socket: " + std::string(strerror(errno)));
        }

        std::cout << "Unix socket successfully bound to " << m_Path << " and listening for connections." << std::endl;

        while (true)
        {
            int cfd = accept(sfd, nullptr, nullptr);

            if (cfd < 0)
            {
                close(sfd);
                throw std::runtime_error("Unable to accept connection on unix socket: " + std::string(strerror(errno)));
            }

            std::cout << "Accepted connection with file descriptor: " << cfd << std::endl;

            std::thread(
                [this, cfd]()
                {
                    auto physicalConnection = std::make_unique<PhysicalConnection>(cfd);
                    auto linkConnection = std::make_shared<LinkConnection>(std::move(physicalConnection));

                    std::cout << "Listening for frames on unix socket " << cfd << "." << std::endl;

                    RegisterConnection(linkConnection);

                    Frame frame;

                    while (true)
                    {
                        try
                        {
                            linkConnection->Receive(frame);
                        }
                        catch (const std::runtime_error &e)
                        {
                            std::cerr << "Error while receiving frame from unix socket " << cfd << ": " << e.what() << std::endl;
                            break;
                        }

                        m_InterceptionMutex.lock();

                        if (m_DemoMode == HubControl::Automatic)
                        {
                            std::cout << "Broadcasting frame (automatic mode)." << std::endl;
                            Broadcast(frame, linkConnection);
                        }
                        else
                        {
                            HandleManualMode(frame, linkConnection);
                        }

                        m_InterceptionMutex.unlock();
                    }

                    UnregisterConnection(linkConnection);

                    linkConnection->Close();
                })
                .detach();
        }
    }

private:
    std::string m_Path;
    HubControl m_DemoMode;

    std::mutex m_ConnectionsMutex;
    std::mutex m_InterceptionMutex;
    std::vector<std::shared_ptr<LinkConnection>> m_Connections;

    void HandleManualMode(Frame &frame, std::shared_ptr<LinkConnection> sender)
    {
        std::vector<uint8_t> rawFrame = SerializeFrame(frame);
        
        std::cout << "\n=== MANUAL MODE ===" << std::endl;
        DisplayFrameParts(rawFrame);
        std::cout << "\nFull frame (hex): " << BytesToHexString(rawFrame) << std::endl;
        std::cout << "\nStrucutred " << frame << std::endl;
        
        while (true)
        {
            std::cout << "\nCommands: flip <n> <start> <end> | set <hex> | drop | broadcast" << std::endl;
            std::cout << "> ";
            
            std::string command;
            std::cin >> command;
            
            if (command == "drop")
            {
                std::cout << "Frame dropped." << std::endl;
                break;
            }
            else if (command == "broadcast")
            {
                std::cout << "Broadcasting frame..." << std::endl;
                BroadcastRaw(rawFrame, sender);
                break;
            }
            else if (command == "flip")
            {
                int n, start, end;
                if (std::cin >> n >> start >> end)
                {
                    FlipBits(rawFrame, n, start, end);
                    std::cout << "Flipped " << n << " bits in range [" << start << ", " << end << "]" << std::endl;
                    std::cout << "Modified frame: " << BytesToHexString(rawFrame) << std::endl;
                }
                else
                {
                    std::cout << "Invalid flip command syntax." << std::endl;
                    std::cin.clear();
                    std::cin.ignore(10000, '\n');
                }
            }
            else if (command == "set")
            {
                std::string hexString;
                if (std::cin >> hexString)
                {
                    if (SetFrameFromHex(rawFrame, hexString))
                    {
                        std::cout << "Frame set to: " << BytesToHexString(rawFrame) << std::endl;
                    }
                    else
                    {
                        std::cout << "Invalid hex string or size." << std::endl;
                    }
                }
                else
                {
                    std::cout << "Invalid set command syntax." << std::endl;
                }
            }
            else
            {
                std::cout << "Unknown command." << std::endl;
                std::cin.clear();
                std::cin.ignore(10000, '\n');
            }
        }
    }

    std::vector<uint8_t> SerializeFrame(const Frame &frame)
    {
        std::vector<uint8_t> buffer;
        
        // Preamble
        buffer.push_back(Frame::Preamble[0]);
        buffer.push_back(Frame::Preamble[1]);
        
        // Header
        buffer.push_back(frame.DestinationAddress);
        buffer.push_back(frame.SourceAddress);
        buffer.push_back(frame.Length);
        buffer.push_back(frame.ID);
        buffer.push_back(frame.ACK);
        
        // Payload
        for (int i = 0; i < frame.Length; ++i)
        {
            buffer.push_back(frame.Payload[i]);
        }
        
        // CRC (little-endian)
        buffer.push_back(frame.CRC & 0xFF);
        buffer.push_back((frame.CRC >> 8) & 0xFF);
        buffer.push_back((frame.CRC >> 16) & 0xFF);
        buffer.push_back((frame.CRC >> 24) & 0xFF);
        
        return buffer;
    }

    Frame DeserializeFrame(const std::vector<uint8_t> &buffer)
    {
        Frame frame;
        
        if (buffer.size() < FRAME_PREAMBLE_SIZE + FRAME_HEADER_SIZE + FRAME_TRAILER_SIZE)
        {
            throw std::runtime_error("Buffer too small to deserialize frame");
        }
        
        int offset = FRAME_PREAMBLE_SIZE; // Skip preamble
        
        frame.DestinationAddress = buffer[offset++];
        frame.SourceAddress = buffer[offset++];
        frame.Length = buffer[offset++];
        frame.ID = buffer[offset++];
        frame.ACK = buffer[offset++];
        
        // Clear payload first
        std::memset(frame.Payload, 0, FRAME_PAYLOAD_SIZE);
        
        // Copy payload data (limited by actual frame length and buffer size)
        int payloadSize = std::min(static_cast<int>(frame.Length), 
                                 static_cast<int>(buffer.size() - offset - FRAME_TRAILER_SIZE));
        for (int i = 0; i < payloadSize; ++i)
        {
            frame.Payload[i] = buffer[offset++];
        }
        
        // Skip any remaining payload bytes in buffer
        offset += (buffer.size() - offset - FRAME_TRAILER_SIZE);
        
        // CRC (little-endian)
        if (offset + 4 <= buffer.size())
        {
            frame.CRC = buffer[offset] | 
                       (buffer[offset + 1] << 8) | 
                       (buffer[offset + 2] << 16) | 
                       (buffer[offset + 3] << 24);
        }
        
        return frame;
    }

    void DisplayFrameParts(const std::vector<uint8_t> &buffer)
    {
        std::cout << "Frame parts:" << std::endl;
        
        if (buffer.size() >= FRAME_PREAMBLE_SIZE)
        {
            std::cout << "  Preamble:  " << BytesToHexString(std::vector<uint8_t>(buffer.begin(), buffer.begin() + FRAME_PREAMBLE_SIZE)) << std::endl;
        }
        
        if (buffer.size() >= FRAME_PREAMBLE_SIZE + FRAME_HEADER_SIZE)
        {
            std::cout << "  Header:    " << BytesToHexString(std::vector<uint8_t>(buffer.begin() + FRAME_PREAMBLE_SIZE, buffer.begin() + FRAME_PREAMBLE_SIZE + FRAME_HEADER_SIZE)) << std::endl;
        }
        
        if (buffer.size() > FRAME_PREAMBLE_SIZE + FRAME_HEADER_SIZE + FRAME_TRAILER_SIZE)
        {
            int payloadStart = FRAME_PREAMBLE_SIZE + FRAME_HEADER_SIZE;
            int payloadEnd = buffer.size() - FRAME_TRAILER_SIZE;
            std::cout << "  Payload:   " << BytesToHexString(std::vector<uint8_t>(buffer.begin() + payloadStart, buffer.begin() + payloadEnd)) << std::endl;
        }
        
        if (buffer.size() >= FRAME_TRAILER_SIZE)
        {
            std::cout << "  CRC:       " << BytesToHexString(std::vector<uint8_t>(buffer.end() - FRAME_TRAILER_SIZE, buffer.end())) << std::endl;
        }
    }

    std::string BytesToHexString(const std::vector<uint8_t> &bytes)
    {
        std::ostringstream oss;
        for (size_t i = 0; i < bytes.size(); ++i)
        {
            oss << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(bytes[i]);
        }
        return oss.str();
    }

    void FlipBits(std::vector<uint8_t> &buffer, int n, int start, int end)
    {
        if (start < 0 || end >= static_cast<int>(buffer.size() * 8) || start > end || n <= 0)
        {
            std::cout << "Invalid bit range or count." << std::endl;
            return;
        }
        
        srand(time(nullptr));
        
        for (int i = 0; i < n; ++i)
        {
            int bitPos = start + (rand() % (end - start + 1));
            int byteIndex = bitPos / 8;
            int bitIndex = bitPos % 8;
            
            if (byteIndex < static_cast<int>(buffer.size()))
            {
                buffer[byteIndex] ^= (1 << bitIndex);
            }
        }
    }

    bool SetFrameFromHex(std::vector<uint8_t> &buffer, const std::string &hexString)
    {
        if (hexString.length() % 2 != 0)
        {
            return false;
        }
        
        std::vector<uint8_t> newBuffer;
        for (size_t i = 0; i < hexString.length(); i += 2)
        {
            std::string byteStr = hexString.substr(i, 2);
            try
            {
                uint8_t byte = static_cast<uint8_t>(std::stoul(byteStr, nullptr, 16));
                newBuffer.push_back(byte);
            }
            catch (const std::exception &)
            {
                return false;
            }
        }
        
        buffer = newBuffer;
        return true;
    }

    void Broadcast(Frame &frame, std::shared_ptr<LinkConnection> sender = nullptr)
    {
        std::lock_guard<std::mutex> lock(m_ConnectionsMutex);

        std::cout << "[DEBUG] Broadcasting frame to " << m_Connections.size() << " connections" << std::endl;
        int sent_count = 0;

        for (const auto &connection : m_Connections)
        {
            if (connection && connection != sender)
            {
                std::cout << "[DEBUG] Sending to connection" << std::endl;
                connection->Send(frame);
                sent_count++;
            }
        }

        std::cout << "[DEBUG] Frame sent to " << sent_count << " connections" << std::endl;
    }

    // Overloaded method to broadcast raw data
    void BroadcastRaw(const std::vector<uint8_t> &rawData, std::shared_ptr<LinkConnection> sender = nullptr)
    {
        std::lock_guard<std::mutex> lock(m_ConnectionsMutex);

        std::cout << "[DEBUG] Broadcasting raw frame to " << m_Connections.size() << " connections" << std::endl;
        int sent_count = 0;

        for (const auto &connection : m_Connections)
        {
            if (connection && connection != sender)
            {
                std::cout << "[DEBUG] Sending raw data to connection" << std::endl;
                connection->SendRaw(rawData.data(), rawData.size());
                sent_count++;
            }
        }

        std::cout << "[DEBUG] Raw frame sent to " << sent_count << " connections" << std::endl;
    }

    void RegisterConnection(std::shared_ptr<LinkConnection> connection)
    {
        std::lock_guard<std::mutex> lock(m_ConnectionsMutex);
        m_Connections.push_back(connection);
    }

    void UnregisterConnection(std::shared_ptr<LinkConnection> connection)
    {
        std::lock_guard<std::mutex> lock(m_ConnectionsMutex);
        m_Connections.erase(std::remove(m_Connections.begin(), m_Connections.end(), connection), m_Connections.end());
    }
};
