#include <algorithm>
#include "Hub.h"
#include "Client.h"
#include "CRC.h"

int HubMode(const std::string& path)
{
    Hub hub(path);

    try
    {
        hub.Run();
    }
    catch(const std::exception& e)
    {
        std::cerr << "An error ocurred while running hub: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}

int ClientMode(const std::string& path, uint8_t address)
{
    Client client(path, address);
    
    try
    {
        client.run();
    }
    catch (const std::exception& e)
    {
        std::cerr << "An error occurred while running client: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}

void DisplayUsage(const char* programName)
{
    std::cerr << "Usage: " << std::endl;
    std::cerr << "  " << programName << " hub <path>" << std::endl;
    std::cerr << "  " << programName << " client <path> <address>" << std::endl;
}

int main(int argc, char* argv[])
{
    crc_initialize();

    if (argc < 3)
    {
        DisplayUsage(argv[0]);
        return 1;
    }

    char *mode = argv[1];
    char *path = argv[2];

    if (strcmp(mode, "hub") == 0)
    {
        return HubMode(path);
    }
    else if (strcmp(mode, "client") == 0)
    {
        if (argc < 4)
        {
            DisplayUsage(argv[0]);
            return 1;
        }

        int address = std::atoi(argv[3]);

        return ClientMode(path, address);
    }

    return 1;
}
