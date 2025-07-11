#pragma once

#include <iostream>
#include <memory>
#include <cstdint>
#include <cstring>

#include "PhysicalConnection.h"
#include "CRC.h"

#define FRAME_PREAMBLE_SIZE 2
#define FRAME_HEADER_SIZE 5
#define FRAME_PAYLOAD_SIZE 5
#define FRAME_TRAILER_SIZE 4

#define MAXIMUM_FRAME_SIZE (FRAME_PREAMBLE_SIZE + FRAME_HEADER_SIZE + FRAME_PAYLOAD_SIZE + FRAME_TRAILER_SIZE)

struct Frame
{
    static constexpr uint8_t Preamble[FRAME_PREAMBLE_SIZE] = {0xE6, 0x42};

    uint8_t DestinationAddress;
    uint8_t SourceAddress;
    uint8_t Length;
    uint8_t ID;
    uint8_t ACK;
    uint8_t Payload[FRAME_PAYLOAD_SIZE];
    uint32_t CRC;
    bool IsCorrupted = false;
};
inline std::ostream &operator<<(std::ostream &os, const Frame &frame);

class LinkConnection
{
public:
    LinkConnection(std::unique_ptr<PhysicalConnection> physicalConnection)
        : m_PhysicalConnection(std::move(physicalConnection))
    {
    }

    void Send(const Frame &frame)
    {
        int size = 0;

        uint8_t buffer[MAXIMUM_FRAME_SIZE];

        std::cout << "[DEBUG] Send: frame.DestinationAddress=" << static_cast<int>(frame.DestinationAddress) << std::endl;

        std::memcpy(buffer, Frame::Preamble, FRAME_PREAMBLE_SIZE);
        size += FRAME_PREAMBLE_SIZE;

        buffer[size++] = frame.DestinationAddress;
        buffer[size++] = frame.SourceAddress;
        buffer[size++] = frame.Length;
        buffer[size++] = frame.ID;
        buffer[size++] = frame.ACK;

        std::cout << "[DEBUG] Send: buffer[2]=" << static_cast<int>(buffer[2])
                  << " (DestinationAddress in buffer)" << std::endl;

        std::memcpy(buffer + size, frame.Payload, frame.Length);
        size += frame.Length;

        // send CRC as 4 bytes (little-endian)
        buffer[size++] = frame.CRC & 0xFF;
        buffer[size++] = (frame.CRC >> 8) & 0xFF;
        buffer[size++] = (frame.CRC >> 16) & 0xFF;
        buffer[size++] = (frame.CRC >> 24) & 0xFF;

        m_PhysicalConnection->Send(buffer, size);
    }

    void SendRaw(const uint8_t* data, int length)
    {
        m_PhysicalConnection->Send(data, length);
    }

    void Receive(Frame &frame)
    {
        uint8_t buffer[MAXIMUM_FRAME_SIZE];

        while (true)
        {
            std::cout << "[DEBUG] LinkConnection: Waiting for preamble..." << std::endl;
            m_PhysicalConnection->Receive(buffer, FRAME_PREAMBLE_SIZE);
            std::cout << "[DEBUG] LinkConnection: Got preamble bytes: 0x" << std::hex
                      << static_cast<int>(buffer[0]) << " 0x" << static_cast<int>(buffer[1]) << std::dec << std::endl;

            if (std::memcmp(buffer, Frame::Preamble, FRAME_PREAMBLE_SIZE) != 0)
            {
                std::cerr << "Invalid frame preamble received, skipping..." << std::endl;
                continue;
            }

            std::cout << "[DEBUG] LinkConnection: Valid preamble found" << std::endl;

            m_PhysicalConnection->Receive(buffer, FRAME_HEADER_SIZE);

            frame.DestinationAddress = buffer[0];
            frame.SourceAddress = buffer[1];
            frame.Length = buffer[2];
            frame.ID = buffer[3];
            frame.ACK = buffer[4];

            std::cout << "[DEBUG] Receive: buffer[0]=" << static_cast<int>(buffer[0])
                      << ", frame.DestinationAddress=" << static_cast<int>(frame.DestinationAddress) << std::endl;

            if (frame.Length > FRAME_PAYLOAD_SIZE)
            {
                std::cerr << "Invalid frame length received: " << static_cast<int>(frame.Length) << ", skipping..." << std::endl;
                continue;
            }

            m_PhysicalConnection->Receive(frame.Payload, frame.Length);
            m_PhysicalConnection->Receive(buffer, FRAME_TRAILER_SIZE);

            // reconstruct CRC from 4 bytes (little-endian)
            frame.CRC = buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24);

            uint8_t frameData[FRAME_HEADER_SIZE + FRAME_PAYLOAD_SIZE];
            frameData[0] = frame.DestinationAddress;
            frameData[1] = frame.SourceAddress;
            frameData[2] = frame.Length;
            frameData[3] = frame.ID;
            frameData[4] = frame.ACK;
            std::memcpy(frameData + FRAME_HEADER_SIZE, frame.Payload, frame.Length);

            uint32_t calculatedCRC = crc32(frameData, FRAME_HEADER_SIZE + frame.Length);

            if (calculatedCRC != frame.CRC)
            {
                std::cerr << "CRC mismatch! Expected: 0x" << std::hex << calculatedCRC
                          << ", Received: 0x" << frame.CRC << std::dec << " - frame corrupted but passed to upper layer for Go-Back-N handling" << std::endl;
                frame.IsCorrupted = true;
            }
            else
            {
                frame.IsCorrupted = false;
            }

            return;
        }
    }

    void Close()
    {
        if (m_PhysicalConnection)
        {
            m_PhysicalConnection->Close();
            m_PhysicalConnection.reset();
        }
    }

private:
    std::unique_ptr<PhysicalConnection> m_PhysicalConnection;
};

inline std::ostream &operator<<(std::ostream &os, const Frame &frame)
{
    os << "Frame: " << std::endl;
    os << "  Destination Address: 0x" << std::hex << static_cast<int>(frame.DestinationAddress) << std::endl;
    os << "  Source Address: 0x" << std::hex << static_cast<int>(frame.SourceAddress) << std::endl;
    os << "  Length: " << std::dec << static_cast<int>(frame.Length) << std::endl;
    os << "  ID: " << std::dec << static_cast<int>(frame.ID) << std::endl;
    os << ((frame.ACK == 1) ? "  ACK\n" : "");
    os << "  Payload: ";

    for (int i = 0; i < frame.Length; ++i)
    {
        os << "0x" << std::hex << static_cast<int>(frame.Payload[i]) << " ";
    }

    os << std::endl;

    os << "  CRC: 0x" << std::hex << static_cast<int>(frame.CRC);

    os << std::dec;

    return os;
}
