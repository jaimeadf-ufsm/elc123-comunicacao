#ifndef CRC_H
#define CRC_H

#include <stdint.h>
#include <stdlib.h>

uint32_t crc32(const uint8_t *data, size_t len);
void crc_initialize();

#endif