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
            session: Session::new(50),
        }
    }
    pub fn add_reply_string(&mut self, reply: &str) {
        self.session.reply(reply);
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
    pub fn last_function_calls(&self) -> Vec<String> {
        let mut calls = Vec::new();
        for part in self.session.get_last_chat().unwrap().parts() {
            if let PartType::FunctionCall(call) = part.data() {
                calls.push(Self::function_name_to_text(call.name()).to_string());
            }
        }
        calls.sort();
        calls.dedup();
        calls
    }
    pub fn add_chat(&mut self, chat: &str) {
        match from_str(chat) {
            Ok(chat) => {
                if let Err(e) = self.session.add_chat(chat) {
                    self.session
                        .reply(format!("ERROR: INVALID SESSION HISTORY\n{e}"));
                }
            }
            Err(e) => {
                self.session
                    .reply(format!("ERROR: INVALID RESPONSE FORMAT\n{e}"));
            }
        }
    }
}
