#pragma once

#include "LinkConnection.h"

class TransportConnection
{
public:
    TransportConnection(std::unique_ptr<LinkConnection> linkConnection)
        : m_LinkConnection(std::move(linkConnection))
    {
    }

    void Send()
    {
    }

    void Receive()
    {
    }

    void Close()
    {
        if (m_LinkConnection)
        {
            m_LinkConnection->Close();
            m_LinkConnection.reset();
        }
    }

private:
    std::unique_ptr<LinkConnection> m_LinkConnection;
};