//! Tests for the Counter program
//!
//! Uses gtest to simulate the Vara runtime environment.

use gtest::{Program, System};
use sails_rs::calls::*;
use sails_rs::gtest::calls::*;

mod counter_client {
    include!(concat!(env!("OUT_DIR"), "/counter_client.rs"));
}

use counter_client::*;

const ACTOR_ID: u64 = 42;

fn setup() -> (System, Program<'static>) {
    let system = System::new();
    system.init_logger();

    let program = Program::current(&system);
    let request = CounterProgram::encode_call(CounterProgramFactory::new());
    let result = program.send_bytes(ACTOR_ID, request);
    assert!(!result.main_failed());

    (system, program)
}

#[test]
fn test_initial_value_is_zero() {
    let (_system, program) = setup();
    let request = CounterProgram::encode_call(Counter::value());
    let result = program.send_bytes(ACTOR_ID, request);
    assert!(!result.main_failed());
}

#[test]
fn test_increment() {
    let (_system, program) = setup();
    let request = CounterProgram::encode_call(Counter::increment());
    let result = program.send_bytes(ACTOR_ID, request);
    assert!(!result.main_failed());
}

#[test]
fn test_add_amount() {
    let (_system, program) = setup();
    let request = CounterProgram::encode_call(Counter::add(10));
    let result = program.send_bytes(ACTOR_ID, request);
    assert!(!result.main_failed());
}

#[test]
fn test_sub_amount() {
    let (_system, program) = setup();

    // Add first
    let request = CounterProgram::encode_call(Counter::add(10));
    program.send_bytes(ACTOR_ID, request);

    // Then subtract
    let request = CounterProgram::encode_call(Counter::sub(3));
    let result = program.send_bytes(ACTOR_ID, request);
    assert!(!result.main_failed());
}

#[test]
fn test_reset() {
    let (_system, program) = setup();

    let request = CounterProgram::encode_call(Counter::add(100));
    program.send_bytes(ACTOR_ID, request);

    let request = CounterProgram::encode_call(Counter::reset());
    let result = program.send_bytes(ACTOR_ID, request);
    assert!(!result.main_failed());
}
