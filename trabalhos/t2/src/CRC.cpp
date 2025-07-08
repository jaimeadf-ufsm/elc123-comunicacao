#include "CRC.h"
#include <stdio.h>

#define CRC_POLYNOMIAL 0x04C11DB7
#define CRC_TABLE_SIZE 256

uint32_t crc_table[CRC_TABLE_SIZE];

uint32_t reflect(uint32_t data, int bits)
{
    uint32_t reflection = 0;
    for (int i = 0; i < bits; i++)
    {
        if (data & 0x01)
            reflection |= (1 << (bits - 1 - i));
        data >>= 1;
    }
    return reflection;
}

void generate_table(uint32_t *table, uint32_t poly)
{
    poly = reflect(poly, 32);

    for (uint32_t i = 0; i < CRC_TABLE_SIZE; i++)
    {
        uint32_t crc = i;
        for (int j = 0; j < 8; j++)
        {
            if (crc & 1)
                crc = (crc >> 1) ^ poly;
            else
                crc >>= 1;
        }

        table[i] = crc;
    }
}

uint32_t crc32(const uint8_t *data, size_t len)
{
    uint32_t crc = 0xFFFFFFFF;

    for (size_t i = 0; i < len; ++i)
    {
        uint8_t idx = (crc ^ data[i]) & 0xFF;
        crc = (crc >> 8) ^ crc_table[idx];
    }

    return crc ^ 0xFFFFFFFF;
}

void crc_initialize()
{
    generate_table(crc_table, CRC_POLYNOMIAL);
}
