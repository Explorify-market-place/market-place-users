use gemini_client_api::gemini::types::{request::PartType, sessions::Session};
use serde_json::{from_str, to_string};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct SessionManager {
    session: Session,
}
#[wasm_bindgen]
impl SessionManager {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            session: Session::new(10),
        }
    }
    pub fn add_reply(&mut self, parts: &str) {
        self.session.reply_parts(from_str(parts).unwrap());
    }
    pub fn add_reply_string(&mut self, reply: &str) {
        self.session.reply(reply);
    }
    pub fn ask(&mut self, parts: &str) {
        match from_str(parts) {
            Ok(parts) => self.session.ask_parts(parts),
            Err(e) => self.session.ask(format!("INVALID_RESPONSE:\n{e}")),
        };
    }
    pub fn ask_string(&mut self, query: &str) {
        self.session.ask(query);
    }
    pub fn get_session(&self) -> String {
        to_string(&self.session).unwrap()
    }
    pub fn get_last_reply(&self) -> String {
        self.session
            .get_last_chat()
            .unwrap()
            .get_text_no_think("\n")
    }
    fn function_name_to_text(name: &str) -> &'static str {
        match name {
            "flights_between" => "Searching flights",
            "flight_booking_link" => "Getting flight booking link",
            "flight_booking_details" => "Reading flight details",
            "trains_between" => "Searching trains",
            "train_seats_available" => "Checking seats available",
            "get_about_place" => "Finding best scenery",
            "get_hotel_by_coordinates" => "Searching hotels",
            "get_hotel_details" => "Getting hotel booking link",
            "get_room_availability" => "Checking available rooms",
            "get_hotel_description" => "Reading about a hotel",
            _ => "Magic!",
        }
    }
    pub fn last_parts(&self) -> String {
        let mut calls = Vec::new();
        for part in self.session.get_last_chat().unwrap().parts() {
            if let PartType::FunctionCall(call) = part.data() {
                calls.push(Self::function_name_to_text(call.name()));
            }
        }
        calls.sort();
        calls.dedup();
        calls.join(",")
    }
}
