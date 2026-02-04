//! {{PROJECT_NAME}} - A simple counter smart program for Vara Network
//!
//! This program demonstrates basic Sails patterns:
//! - Service definition with state
//! - Commands (state mutations)
//! - Queries (state reads)
//! - Events

#![no_std]

use sails_rs::prelude::*;

/// Counter service state
static mut COUNTER_STATE: Option<CounterState> = None;

/// Internal state structure
#[derive(Default)]
struct CounterState {
    value: i64,
    owner: ActorId,
}

/// The Counter service provides increment/decrement operations
/// with query capabilities
#[derive(Default)]
pub struct CounterService;

/// Events emitted by the Counter service
#[derive(Debug, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub enum CounterEvent {
    /// Emitted when the counter value changes
    ValueChanged { old_value: i64, new_value: i64 },
    /// Emitted when the counter is reset
    Reset { by: ActorId },
}

#[sails_rs::service(events = CounterEvent)]
impl CounterService {
    /// Create a new counter service instance
    pub fn new() -> Self {
        Self
    }

    /// Initialize the counter state (called once at program init)
    pub fn init(&mut self) {
        unsafe {
            COUNTER_STATE = Some(CounterState {
                value: 0,
                owner: gstd::msg::source(),
            });
        }
    }

    /// Increment the counter by 1
    /// Returns the new value
    pub fn increment(&mut self) -> i64 {
        let (old_value, new_value) = {
            let state = self.state_mut();
            let old = state.value;
            state.value = state.value.saturating_add(1);
            (old, state.value)
        };
        
        self.notify_on(CounterEvent::ValueChanged {
            old_value,
            new_value,
        })
        .expect("Failed to emit event");
        
        new_value
    }

    /// Decrement the counter by 1
    /// Returns the new value
    pub fn decrement(&mut self) -> i64 {
        let (old_value, new_value) = {
            let state = self.state_mut();
            let old = state.value;
            state.value = state.value.saturating_sub(1);
            (old, state.value)
        };
        
        self.notify_on(CounterEvent::ValueChanged {
            old_value,
            new_value,
        })
        .expect("Failed to emit event");
        
        new_value
    }

    /// Add a specific amount to the counter
    /// Returns the new value
    pub fn add(&mut self, amount: i64) -> i64 {
        let (old_value, new_value) = {
            let state = self.state_mut();
            let old = state.value;
            state.value = state.value.saturating_add(amount);
            (old, state.value)
        };
        
        self.notify_on(CounterEvent::ValueChanged {
            old_value,
            new_value,
        })
        .expect("Failed to emit event");
        
        new_value
    }

    /// Reset the counter to zero (only owner can do this)
    pub fn reset(&mut self) -> Result<i64, &'static str> {
        let caller = gstd::msg::source();
        
        let old_value = {
            let state = self.state_mut();
            if caller != state.owner {
                return Err("Only owner can reset the counter");
            }
            let old = state.value;
            state.value = 0;
            old
        };
        
        self.notify_on(CounterEvent::Reset { by: caller })
            .expect("Failed to emit event");
        self.notify_on(CounterEvent::ValueChanged {
            old_value,
            new_value: 0,
        })
        .expect("Failed to emit event");
        
        Ok(0)
    }

    /// Query the current counter value
    pub fn value(&self) -> i64 {
        self.state().value
    }

    /// Query the owner of this counter
    pub fn owner(&self) -> ActorId {
        self.state().owner
    }

    /// Internal helper to get immutable state
    fn state(&self) -> &CounterState {
        unsafe { COUNTER_STATE.as_ref().expect("State not initialized") }
    }

    /// Internal helper to get mutable state
    fn state_mut(&mut self) -> &mut CounterState {
        unsafe { COUNTER_STATE.as_mut().expect("State not initialized") }
    }
}

/// The main program structure
pub struct CounterProgram;

#[sails_rs::program]
impl CounterProgram {
    /// Program constructor - initializes the counter
    pub fn new() -> Self {
        let mut service = CounterService::new();
        service.init();
        Self
    }

    /// Expose the counter service
    pub fn counter(&self) -> CounterService {
        CounterService::new()
    }
}
