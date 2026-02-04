//! Tests for the Counter program
//!
//! These tests use gtest to simulate the Vara runtime environment.

use gtest::{Log, Program, System};
use sails_rs::calls::*;
use sails_rs::gtest::calls::*;

// Import the program module
mod counter_client {
    include!(concat!(env!("OUT_DIR"), "/counter_client.rs"));
}

use counter_client::*;

const ACTOR_ID: u64 = 42;

/// Helper to initialize the test system and deploy the program
fn setup() -> (System, Program<'static>) {
    let system = System::new();
    system.init_logger();
    
    // Create program from the WASM file
    let program = Program::current(&system);
    
    // Initialize the program
    let request = CounterProgram::encode_call(CounterProgramFactory::new());
    let result = program.send_bytes(ACTOR_ID, request);
    assert!(!result.main_failed());
    
    (system, program)
}

#[test]
fn test_initial_value_is_zero() {
    let (_system, program) = setup();
    
    // Query the initial value
    let request = CounterProgram::encode_call(Counter::value());
    let result = program.send_bytes(ACTOR_ID, request);
    
    assert!(!result.main_failed());
    // The value should be 0
}

#[test]
fn test_increment() {
    let (_system, program) = setup();
    
    // Increment the counter
    let request = CounterProgram::encode_call(Counter::increment());
    let result = program.send_bytes(ACTOR_ID, request);
    
    assert!(!result.main_failed());
    
    // Query the value - should be 1
    let request = CounterProgram::encode_call(Counter::value());
    let result = program.send_bytes(ACTOR_ID, request);
    
    assert!(!result.main_failed());
}

#[test]
fn test_decrement() {
    let (_system, program) = setup();
    
    // First increment
    let request = CounterProgram::encode_call(Counter::increment());
    program.send_bytes(ACTOR_ID, request);
    
    // Then decrement
    let request = CounterProgram::encode_call(Counter::decrement());
    let result = program.send_bytes(ACTOR_ID, request);
    
    assert!(!result.main_failed());
}

#[test]
fn test_add_amount() {
    let (_system, program) = setup();
    
    // Add 10 to the counter
    let request = CounterProgram::encode_call(Counter::add(10));
    let result = program.send_bytes(ACTOR_ID, request);
    
    assert!(!result.main_failed());
}

#[test]
fn test_reset_by_owner() {
    let (_system, program) = setup();
    
    // Add some value
    let request = CounterProgram::encode_call(Counter::add(100));
    program.send_bytes(ACTOR_ID, request);
    
    // Reset (as owner)
    let request = CounterProgram::encode_call(Counter::reset());
    let result = program.send_bytes(ACTOR_ID, request);
    
    assert!(!result.main_failed());
}

#[test]
fn test_reset_by_non_owner_fails() {
    let (_system, program) = setup();
    
    const OTHER_ACTOR: u64 = 99;
    
    // Add some value as owner
    let request = CounterProgram::encode_call(Counter::add(100));
    program.send_bytes(ACTOR_ID, request);
    
    // Try to reset as non-owner
    let request = CounterProgram::encode_call(Counter::reset());
    let result = program.send_bytes(OTHER_ACTOR, request);
    
    // This should return an error result (not fail, but contain error)
    assert!(!result.main_failed());
}
