#include "Timer.h"

Timer::Timer() {
	time1 = std::chrono::steady_clock::now();
	time2 = std::chrono::steady_clock::now();
}

void Timer::start() {
	time1 = std::chrono::steady_clock::now();
	time2 = std::chrono::steady_clock::now();
}

float Timer::update() {
	time2 = std::chrono::steady_clock::now();
	float deltaTime = std::chrono::duration_cast<std::chrono::microseconds>(time2 - time1).count() / 1000.0f;
	return deltaTime;
}

