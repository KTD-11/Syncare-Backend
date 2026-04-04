/**
 * @file main.c
 * @brief Bitwise Hospital Scheduling Engine
 * * This program takes a list of requested appointment times and a desired duration,
 * and schedules them into a 16-bit integer representing a half-day (8:00 AM to 12:00 PM)
 * partitioned into 15-minute slots.
 * * If a time collision occurs, the engine uses a "Ripple Search" to automatically
 * push the appointment forward to the next available slot.
 * * Usage: ./scheduler [requested_time_1] [requested_time_2] ... [duration_in_minutes]
 * Example: ./scheduler "8:00" "8:15" "30"
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#define HOSPITAL_OPENING 8
#define SLOTS_PER_HOUR 4
#define MINUTES_TO_SLOTS 15
#define HOSPITAL_CLOSING 12
#define ALL_SLOTS 16
#define NULL_TERM 1
#define SLOT_SHIFT 1

// ARGUMENTS: preferred time, booked times, book duration
//since the hospital starts at 8
int normalize_time(char *time_string);
int book(unsigned int *day, int book_duration, int argc, char **argv);
void denormalize_time(int reserved_bit);

int main(const int argc, char **argv)
{
    // Require at least the executable, one time string, and the duration
    if (argc < 2)
    {
        fprintf(stderr, "USAGE: bookings..., booking length\n");
        return -1;
    }

    // The core state variable. 16 bits representing 16 x 15-min slots.
    // 0 = empty, 1 = booked.
    unsigned int day = 0x0000;

    // The final argument is the duration in minutes. Convert it directly
    // to the number of required slots (e.g., 30 minutes / 15 = 2 slots).
    const int book_duration = atoi(argv[argc - SLOT_SHIFT]) / MINUTES_TO_SLOTS;

    // Guardrail: reject 0-minute appointments or appointments longer than the whole day
    if (book_duration == 0 || book_duration > 16)
        return -1;

    // Pass the state variable by reference so the engine can modify it
    if (book(&day, book_duration, argc, argv) != 0)
        return -1;
}

/**
 * @brief Converts a "HH:MM" string into a 0-indexed slot integer.
 * * Calculates the offset from HOSPITAL_OPENING based on 15-minute intervals.
 * For example, "08:00" -> 0, "08:30" -> 2, "09:00" -> 4.
 * * @param time_string The time format string to parse (e.g., "08:00").
 * @return The integer slot index, or -1 if invalid/out of bounds.
 */
int normalize_time(char *time_string)
{
    int time = 0;
    char *saveptr = NULL;

    // Parse the hour portion
    const char *time_token_str = strtok_r(time_string, ":", &saveptr);

    if (time_token_str == NULL)
        return -1;

    int time_token_int = atoi(time_token_str);

    // Ensure the hour is within operating bounds
    if (time_token_int < HOSPITAL_OPENING)
        return -1;

    if (time_token_int > HOSPITAL_CLOSING)
        return -1;

    // Convert hour offset into base slots
    time += (time_token_int - HOSPITAL_OPENING) * SLOTS_PER_HOUR;

    // Parse the minute portion
    time_token_str = strtok_r(NULL, ":", &saveptr);

    if (time_token_str == NULL)
        return -1;

    // Convert minutes directly to slots (e.g., 30 / 15 = 2)
    time_token_int = atoi(time_token_str) / MINUTES_TO_SLOTS;

    if (time_token_int < 0)
        return -1;

    time += time_token_int;

    return time;
}

/**
 * @brief The core scheduling engine with auto-collision resolution.
 * * Iterates through requested times, maps them to bitmasks, checks for collisions
 * against the master `day` integer using Bitwise AND, and seamlessly pushes
 * appointments forward using a carry-over mechanism if a collision is detected.
 * * @param day Pointer to the master 16-bit state integer.
 * @param book_duration The number of slots the appointment requires.
 * @param argc Argument count to govern the loop.
 * @param argv Argument vector containing the time strings.
 * @return 0 on success, -1 if an appointment is pushed past closing time or parsing fails.
 */
int book(unsigned int *day, const int book_duration, const int argc, char **argv)
{
    // Accumulator to push appointments forward when collisions occur
    int carry_over = 0;

    // Loop through all provided appointment string arguments (ignoring duration at the end)
    for (int i = 1; i < argc - 1; i++)
    {
        // Variable Length Array (VLA) for memory-safe string manipulation
        char booked[strlen(argv[i]) + NULL_TERM];
        unsigned int appointment_mask = 0x0000;

        strcpy(booked, argv[i]);

        // Calculate starting slot and immediately apply any forward shift from previous collisions
        const int reserved_bit = normalize_time(booked) + carry_over;

        // Algebraically extract the raw return value to check for parsing errors
        // (Neutralizes the edge-case where a failed parse (-1) + carry_over creates a false valid index)
        if (reserved_bit - carry_over == -1)
            return -1;

        // Build the test mask for the entire duration block ("Check first, commit second")
        for (int j = 0; j < book_duration; j++)
        {
            // Calculate left-shift amount to align the slot bit. Reads left-to-right.
            const int shift = ALL_SLOTS - SLOT_SHIFT - (reserved_bit + j);

            // Guardrail: If the push causes the appointment to bleed past closing time
            if (shift < 0 || shift > ALL_SLOTS)
                return -1;

            const unsigned int mask = (unsigned int) 0b1 << shift;

            // Paint the bits into the temporary mask
            appointment_mask = appointment_mask | mask;
        }

        // COLLISION CHECK: Bitwise AND checks if any 1s overlap between the day and the new mask
        if ((*day & appointment_mask) != 0)
        {
            // Collision detected! Rewind the loop counter to process the same string again,
            // but add the duration to the carry_over to push it to the next available block.
            i--;
            carry_over += book_duration;
            continue;
        }

        // SUCCESS: No collision. Bitwise OR commits the appointment to the master state.
        *day = *day | appointment_mask;

        denormalize_time(reserved_bit);


        // Reset the collision forward-shift for the next incoming patient
        carry_over = 0;
    }

    return 0;
}

/**
 * @brief Converts a 0-indexed slot integer back into a human-readable "HH:MM" format.
 * * Uses standard division and modulo arithmetic to reconstruct the actual clock time
 * from the bit's index position and prints it to the standard output.
 * * @param reserved_bit The integer slot index where the appointment starts (e.g., 2 -> 08:30).
 */
void denormalize_time(const int reserved_bit)
{
    // Divide by 4 to get the hours to add
    const int hours = HOSPITAL_OPENING + (reserved_bit / SLOTS_PER_HOUR);

    // Modulo 4 gets the remaining slots (0, 1, 2, or 3), multiply by 15 minutes
    const int minutes = (reserved_bit % SLOTS_PER_HOUR) * MINUTES_TO_SLOTS;

    // Use %02d so it prints "08:00" instead of "8:0"
    printf("|%02d:%02d\n", hours, minutes);
}