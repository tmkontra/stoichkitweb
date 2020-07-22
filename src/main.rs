use warp::{Filter, http::Response};

use serde::{Deserialize, Serialize};
use stoichkit::model::{Reaction, Substance};
use itertools::Itertools;

use env_logger;

#[derive(Deserialize, Serialize)]
struct SubstanceRequest {
    formula: String,
    mass: f32,
    coeff: Option<u32>,
}

impl SubstanceRequest {
    pub fn to_substance(self: &Self) -> Result<Substance, String> {
        Substance::new(self.formula.as_str(), self.mass, self.coeff)
    }
}

#[derive(Deserialize, Serialize)]
struct ReactionRequest {
    reagents: Vec<SubstanceRequest>,
    product: SubstanceRequest,
}

impl ReactionRequest {
    pub fn reaction(self: &Self) -> Result<Reaction, String> {
        let reagents: Result<Vec<Substance>, _> =
            self.reagents.iter().map(|r| r.to_substance()).collect();
        Ok(Reaction::new(reagents?, self.product.to_substance()?))
    }
}

#[derive(Deserialize, Serialize)]
struct BalanceRequest {
    reagents: Vec<String>,
    products: Vec<String>
}

impl BalanceRequest {
    pub fn balance(self: &Self) -> Result<String, String> {
        let reagents: Vec<Substance> = self.reagents
            .iter()
            .map(|f| Substance::from_formula(f.as_str()).unwrap())
            .collect();
        let products: Vec<Substance> = self.products
            .iter()
            .map(|f| Substance::from_formula(f.as_str()).unwrap())
            .collect();
        let balanced: Vec<(String, i32)> = stoichkit::solve::balance(reagents, products);
        let rx_len = self.reagents.clone().len() + 1;
        let balr: Vec<String> = balanced
            .iter()
            .take(rx_len - 1 as usize)
            .map(|(e, c)| format!("{} {}", c, e))
            .collect();
        let balp: Vec<String> = balanced
            .iter()
            .dropping(rx_len - 1)
            .map(|(e, c)| format!("{} {}", c, e))
            .collect();
        let result = format!("{} = {}", balr.join(" + "), balp.join(" + "));
        Ok(result)
    }
}

#[tokio::main]
async fn main() {
    env_logger::init();

    let cors = warp::cors()
        .allow_any_origin()
        .allow_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
        .allow_headers(vec!["content-type"])
        .build();

    // GET /hello/warp => 200 OK with body "Hello, warp!"
    let pctyield = warp::path!("yield")
        .and(warp::body::json())
        .map(|r: ReactionRequest| {
            match r.reaction()
                .map(|r| r.percent_yield())
                .map(|y| format!("{}", y)) {
                Ok(yld) => Response::builder().body(yld),
                Err(msg) => Response::builder().status(400).body(msg)
            }
        });

    let balance = warp::path!("balance")
        .and(warp::body::json())
        .map(|r: BalanceRequest| {
            r.balance().unwrap_or_else(|e| e)
        });

    let serve_static = warp::fs::dir("./web");

    let serve_index =
        warp::path::end().and(warp::fs::file("./web/index.html"));

    let log = warp::log("stoichkitweb");

    warp::serve(pctyield.or(balance).or(serve_index).or(serve_static)
        .with(cors)
        .with(log))
        .run(([0, 0, 0, 0], 3030))
        .await;
}
