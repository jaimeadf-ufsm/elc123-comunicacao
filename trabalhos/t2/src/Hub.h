#pragma once

#include <string>
#include <memory>
#include <thread>
#include <mutex>
#include <algorithm>

#include <unistd.h>
#include <sys/socket.h>
#include <sys/un.h>

#include "LinkConnection.h"

class Hub
{
public:
    Hub(const std::string &path) : m_Path(path)
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

                        std::cout << "Broadcasting frame from unix socket " << cfd << "." << std::endl;
                        std::cout << frame << std::endl;
                        std::cout << std::endl;

                        Broadcast(frame, linkConnection);
                    }

                    UnregisterConnection(linkConnection);

                    linkConnection->Close();
                })
                .detach();
        }
    }

private:
    std::string m_Path;

    std::mutex m_ConnectionsMutex;
    std::vector<std::shared_ptr<LinkConnection>> m_Connections;

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
