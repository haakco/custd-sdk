//! A one-thread HTTP/1.1 fake: answers each connection with the next scripted response and
//! records what it received.

use std::io::{BufRead, BufReader, Write};
use std::net::TcpListener;
use std::sync::mpsc::{self, Receiver};
use std::thread;

pub struct Answer {
    pub status: u16,
    pub headers: Vec<(&'static str, &'static str)>,
    pub body: String,
}

pub fn answer(status: u16, body: &str) -> Answer {
    Answer {
        status,
        headers: vec![("Content-Type", "application/json")],
        body: body.to_owned(),
    }
}

#[derive(Debug)]
pub struct Received {
    pub method: String,
    pub target: String,
    pub headers: Vec<(String, String)>,
    pub body: String,
}

impl Received {
    pub fn header(&self, name: &str) -> Option<&str> {
        self.headers
            .iter()
            .find(|(k, _)| k.eq_ignore_ascii_case(name))
            .map(|(_, v)| v.as_str())
    }
}

pub struct FakeServer {
    pub base_url: String,
    received: Receiver<Received>,
}

impl FakeServer {
    pub fn start(answers: Vec<Answer>) -> Self {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let base_url = format!("http://{}", listener.local_addr().unwrap());
        let (sender, received) = mpsc::channel();
        thread::spawn(move || {
            for answer in answers {
                let (mut stream, _) = listener.accept().unwrap();
                sender
                    .send(read_request(&mut BufReader::new(
                        stream.try_clone().unwrap(),
                    )))
                    .unwrap();
                write_answer(&mut stream, &answer);
            }
        });
        Self { base_url, received }
    }

    pub fn next(&self) -> Received {
        self.received.recv().unwrap()
    }
}

fn read_request(reader: &mut impl BufRead) -> Received {
    let mut line = String::new();
    reader.read_line(&mut line).unwrap();
    let mut parts = line.split_whitespace();
    let (method, target) = (
        parts.next().unwrap().to_owned(),
        parts.next().unwrap().to_owned(),
    );
    let mut headers = Vec::new();
    loop {
        let mut header = String::new();
        reader.read_line(&mut header).unwrap();
        let Some((name, value)) = header.trim_end().split_once(": ") else {
            break;
        };
        headers.push((name.to_owned(), value.to_owned()));
    }
    let length = headers
        .iter()
        .find(|(k, _)| k.eq_ignore_ascii_case("content-length"))
        .map_or(0, |(_, v)| v.parse().unwrap());
    let mut body = vec![0; length];
    reader.read_exact(&mut body).unwrap();
    Received {
        method,
        target,
        headers,
        body: String::from_utf8(body).unwrap(),
    }
}

fn write_answer(stream: &mut impl Write, answer: &Answer) {
    let mut head = format!(
        "HTTP/1.1 {} X\r\nConnection: close\r\nContent-Length: {}\r\n",
        answer.status,
        answer.body.len()
    );
    for (name, value) in &answer.headers {
        head.push_str(&format!("{name}: {value}\r\n"));
    }
    stream
        .write_all(format!("{head}\r\n{}", answer.body).as_bytes())
        .unwrap();
}
