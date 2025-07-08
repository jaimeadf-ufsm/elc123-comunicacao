#pragma once

#include <cstdint>
#include <random>
#include <bitset>
#include "LinkConnection.h"

class ErrorSimulator
{
public:
    ErrorSimulator()
        : m_CorruptedBits(0), m_CorruptedStart(0), m_CorruptedEnd(0), m_CorruptedProbability(0.0), m_LostFrameProbability(0.0), m_AckEnabled(true), m_Generator(std::random_device{}()), m_Distribution(0.0, 1.0)
    {
    }

    void setCorruptedBits(int bits) { m_CorruptedBits = bits; }
    void setCorruptedRange(int start, int end)
    {
        m_CorruptedStart = start;
        m_CorruptedEnd = end;
    }
    void setCorruptedProbability(double prob) { m_CorruptedProbability = prob; }
    void setLostFrameProbability(double prob) { m_LostFrameProbability = prob; }
    void setAckEnabled(bool enabled) { m_AckEnabled = enabled; }
    void resetErrors()
    {
        m_CorruptedBits = 0;
        m_CorruptedStart = 0;
        m_CorruptedEnd = 0;
        m_CorruptedProbability = 0.0;
        m_LostFrameProbability = 0.0;
        m_AckEnabled = true;
    }

    int getCorruptedBits() const { return m_CorruptedBits; }
    int getCorruptedStart() const { return m_CorruptedStart; }
    int getCorruptedEnd() const { return m_CorruptedEnd; }
    double getCorruptedProbability() const { return m_CorruptedProbability; }
    double getLostFrameProbability() const { return m_LostFrameProbability; }
    bool isAckEnabled() const { return m_AckEnabled; }

    bool shouldCorruptFrame()
    {
        return m_Distribution(m_Generator) < m_CorruptedProbability;
    }

    bool shouldDropFrame()
    {
        return m_Distribution(m_Generator) < m_LostFrameProbability;
    }

    bool shouldSendAck() const
    {
        return m_AckEnabled;
    }

    void corruptFrame(Frame &frame)
    {

        if (m_CorruptedProbability <= 0.0 && m_CorruptedBits <= 0)
        {
            return;
        }

        if (m_CorruptedProbability > 0.0 && !shouldCorruptFrame())
        {
            return;
        }

        uint8_t originalLength = frame.Length;

        uint8_t frameData[MAXIMUM_FRAME_SIZE];

        std::memset(frameData, 0, sizeof(frameData));

        frameData[0] = frame.DestinationAddress;
        frameData[1] = frame.SourceAddress;
        frameData[2] = frame.Length;
        frameData[3] = frame.ID;
        frameData[4] = frame.ACK;

        if (frame.Length > 0 && frame.Length <= FRAME_PAYLOAD_SIZE)
        {
            std::memcpy(frameData + FRAME_HEADER_SIZE, frame.Payload, frame.Length);
        }

        int frameSize = FRAME_HEADER_SIZE + frame.Length;

        frameData[frameSize++] = frame.CRC & 0xFF;
        frameData[frameSize++] = (frame.CRC >> 8) & 0xFF;
        frameData[frameSize++] = (frame.CRC >> 16) & 0xFF;
        frameData[frameSize++] = (frame.CRC >> 24) & 0xFF;

        int bitsToCorrupt;
        if (m_CorruptedBits > 0)
        {
            bitsToCorrupt = m_CorruptedBits;
        }
        else
        {
            bitsToCorrupt = 1;
        }

        for (int i = 0; i < bitsToCorrupt; i++)
        {
            int bitPosition;
            int maxBitPosition = frameSize * 8 - 1;

            if (m_CorruptedStart < m_CorruptedEnd)
            {
                int rangeStart = std::max(0, std::min(m_CorruptedStart, maxBitPosition));
                int rangeEnd = std::max(0, std::min(m_CorruptedEnd, maxBitPosition));

                if (rangeStart <= rangeEnd)
                {
                    std::uniform_int_distribution<int> rangeDist(rangeStart, rangeEnd);
                    bitPosition = rangeDist(m_Generator);
                }
                else
                {
                    std::uniform_int_distribution<int> bitDist(0, maxBitPosition);
                    bitPosition = bitDist(m_Generator);
                }
            }
            else
            {
                // corrupt random bits in the frame
                std::uniform_int_distribution<int> bitDist(0, maxBitPosition);
                bitPosition = bitDist(m_Generator);
            }

            int byteOffset = bitPosition / 8;
            int bitOffset = bitPosition % 8;

            if (static_cast<size_t>(byteOffset) < frameSize)
            {
                // flip the bit
                frameData[byteOffset] ^= (1 << bitOffset);
            }
        }

        frame.DestinationAddress = frameData[0];
        frame.SourceAddress = frameData[1];

        uint8_t corruptedLength = frameData[2];
        frame.Length = std::min(corruptedLength, static_cast<uint8_t>(FRAME_PAYLOAD_SIZE));

        frame.ID = frameData[3];
        frame.ACK = frameData[4];

        frame.CRC = frameData[frameSize - 4] | (frameData[frameSize - 3] << 8) | (frameData[frameSize - 2] << 16) | (frameData[frameSize - 1] << 24);

        if (originalLength > 0)
        {
            std::memcpy(frame.Payload, frameData + FRAME_HEADER_SIZE, originalLength);
        }
    }

    void printStatus() const
    {
        std::cout << "=== Error Simulator Status ===" << std::endl;
        std::cout << "Corrupted bits: " << m_CorruptedBits << std::endl;
        std::cout << "Corrupted range: [" << m_CorruptedStart << ", " << m_CorruptedEnd << "]" << std::endl;
        std::cout << "Corruption probability: " << m_CorruptedProbability << std::endl;
        std::cout << "Frame loss probability: " << m_LostFrameProbability << std::endl;
        std::cout << "ACK enabled: " << (m_AckEnabled ? "Yes" : "No") << std::endl;
        std::cout << "==============================" << std::endl;
    }

private:
    int m_CorruptedBits;
    int m_CorruptedStart;
    int m_CorruptedEnd;
    double m_CorruptedProbability;
    double m_LostFrameProbability;
    bool m_AckEnabled;

    std::mt19937 m_Generator;
    std::uniform_real_distribution<double> m_Distribution;
};
