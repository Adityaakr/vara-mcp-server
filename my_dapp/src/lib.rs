//! my_dapp - A simple counter smart program for Vara Network
//!
//! Built with Sails framework (sails-rs 0.10)
//!
//! Demonstrates:
//! - Service definition with state
//! - Commands (state mutations) with #[export]
//! - Queries (state reads)
//! - Events via #[event] and emit_event

#![no_std]

use sails_rs::prelude::*;

/// Global counter state
static mut COUNTER: u64 = 0;

/// Events emitted by the Counter service
#[event]
#[derive(Clone, Debug, PartialEq, Encode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub enum CounterEvent {
    /// Emitted when a value is added
    Added(u64),
    /// Emitted when a value is subtracted
    Subtracted(u64),
    /// Emitted when the counter is reset
    Reset,
}

/// Counter service
pub struct CounterService;

impl CounterService {
    pub fn new() -> Self {
        Self
    }
}

#[sails_rs::service(events = CounterEvent)]
impl CounterService {
    /// Add a value to the counter
    #[export]
    pub fn add(&mut self, value: u64) -> u64 {
        unsafe {
            COUNTER = COUNTER.saturating_add(value);
            self.emit_event(CounterEvent::Added(value)).unwrap();
            COUNTER
        }
    }

    /// Subtract a value from the counter
    #[export]
    pub fn sub(&mut self, value: u64) -> u64 {
        unsafe {
            COUNTER = COUNTER.saturating_sub(value);
            self.emit_event(CounterEvent::Subtracted(value)).unwrap();
            COUNTER
        }
    }

    /// Increment by 1
    #[export]
    pub fn increment(&mut self) -> u64 {
        self.add(1)
    }

    /// Decrement by 1
    #[export]
    pub fn decrement(&mut self) -> u64 {
        self.sub(1)
    }

    /// Reset the counter to zero
    #[export]
    pub fn reset(&mut self) -> u64 {
        unsafe {
            COUNTER = 0;
            self.emit_event(CounterEvent::Reset).unwrap();
            COUNTER
        }
    }

    /// Get the current counter value
    #[export]
    pub fn value(&self) -> u64 {
        unsafe { COUNTER }
    }
}

/// The main program
pub struct CounterProgram;

#[sails_rs::program]
impl CounterProgram {
    /// Program constructor
    pub fn new() -> Self {
        Self
    }

    /// Expose the counter service
    pub fn counter(&self) -> CounterService {
        CounterService::new()
    }
}
