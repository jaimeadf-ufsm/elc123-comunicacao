CXX = g++
SRCDIR = src
SOURCES = $(SRCDIR)/main.cpp $(SRCDIR)/Timer.cpp $(SRCDIR)/CRC.cpp
TARGET = main

all: $(TARGET)

$(TARGET): $(SOURCES)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(SOURCES)

clean:
	rm -f $(TARGET)

.PHONY: all clean
