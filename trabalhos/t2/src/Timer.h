#ifndef FRAME_CONTROLLER_H
#define FRAME_CONTROLLER_H

#include <chrono>

class Timer {
private:
	std::chrono::steady_clock::time_point time1, time2;
	std::chrono::steady_clock sclock;
public:
    Timer();
    void start();
    float update();
};

#endif
