#pragma once

#include <iostream>
#include <vector>
#include <stdexcept>
#include <cstdint>
#include <cstring>

#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>

class PhysicalConnection
{
public:
    PhysicalConnection(int sfd) : m_FD(sfd)
    {
    }

    void Send(const uint8_t* data, int length)
    {
        write(m_FD, data, length);
    }

    void Receive(uint8_t* data, int length)
    {
        int totalBytesRead = 0;

        while (totalBytesRead < length)
        {
            ssize_t bytesRead = read(m_FD, data + totalBytesRead, length - totalBytesRead);

            if (bytesRead < 0)
            {
                throw std::runtime_error("Unable to read from socket: " + std::string(strerror(errno)));
            }
            else if (bytesRead == 0)
            {
                throw std::runtime_error("EOF reached while reading from socket");
            }

            totalBytesRead += bytesRead;
        }
    }

    void Close()
    {
        if (m_FD >= 0)
            close(m_FD);
    }

    static PhysicalConnection Connect(const std::string& path)
    {
        int sfd = socket(AF_UNIX, SOCK_STREAM, 0);

        if (sfd < 0)
            throw std::runtime_error("Unable to create unix socket: " + std::string(strerror(errno)));

        struct sockaddr_un addr;

        std::memset(&addr, 0, sizeof(addr));
        addr.sun_family = AF_UNIX;
        std::strncpy(addr.sun_path, path.c_str(), sizeof(addr.sun_path) - 1);
        
        if (connect(sfd, (struct sockaddr*)&addr, sizeof(addr)) < 0)
        {
            close(sfd);
            throw std::runtime_error("Unable to connect to unix socket to path: " + path + ": " + std::string(strerror(errno)));
        }

        std::cout << "Connected to unix socket at path: " << path << std::endl;

        return PhysicalConnection(sfd);
    }

private:
    int m_FD;
};