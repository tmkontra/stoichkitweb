#[macro_use]
extern crate log;

use warp::http::StatusCode;
use warp::{http::Response, Filter};

use serde::{Deserialize, Serialize};
use stoichkit::model::{Reaction, Substance};

use env_logger;
use std::panic;

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

#[derive(Deserialize, Serialize, Debug)]
struct BalanceRequest {
    reagents: Vec<String>,
    products: Vec<String>,
}

#[derive(Serialize, Debug)]
struct BalanceResponse {
    reagents: Vec<(String, u64)>,
    products: Vec<(String, u64)>,
}

impl BalanceResponse {
    pub fn new(reagents: Vec<(String, u64)>, products: Vec<(String, u64)>) -> BalanceResponse {
        BalanceResponse { reagents, products }
    }
}

#[derive(Serialize, Debug)]
struct ErrorResponse {
    message: String,
}

impl warp::reject::Reject for ErrorResponse {}

impl BalanceRequest {
    pub fn balance(self: &Self) -> Result<BalanceResponse, String> {
        debug!("Balancing {:?} = {:?}", self.reagents, self.products);
        let reagents: Vec<Substance> = self
            .reagents
            .iter()
            .filter(|f| !f.is_empty())
            .map(|f| Substance::from_formula(f.as_str()))
            .collect::<Result<Vec<Substance>, String>>()?;
        let products: Vec<Substance> = self
            .products
            .iter()
            .filter(|f| !f.is_empty())
            .map(|f| Substance::from_formula(f.as_str()))
            .collect::<Result<Vec<Substance>, String>>()?;
        match (reagents.clone().len(), products.clone().len()) {
            (x, y) if x >= 1 as usize && y >= 1 as usize => Ok(()),
            _ => Err("Must provide at least 1 reactant and 1 product"),
        }?;
        debug!(
            "Balancing parsed reaction REAGENTS= {:?}, PRODUCTS= {:?}",
            &reagents, &products
        );
        let e: Result<Result<(Vec<(String, u64)>, Vec<(String, u64)>), String>, _> =
            panic::catch_unwind(|| stoichkit::solve::balance(reagents, products));
        match e {
            Ok(Ok((balanced_react, balanced_prod))) => {
                debug!(
                    "Balancing result: {:?} = {:?}",
                    balanced_react, balanced_prod
                );
                Ok(BalanceResponse::new(balanced_react, balanced_prod))
            }
            Ok(Err(error_message)) => {
                warn!(
                    "Could not balance equation: {:?} = {:?}",
                    self.reagents, self.products
                );
                debug!("Balance attempt failed with: {:?}", error_message);
                Err(error_message)
            },
            other => {
                warn!(
                    "Could not balance equation: {:?} = {:?}",
                    self.reagents, self.products
                );
                debug!("Balance attempt failed with: {:?}", other);
                Err("Could not balance equation!".to_string())
            }
        }
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
            match r
                .reaction()
                .map(|r| r.percent_yield())
                .map(|y| format!("{}", y))
            {
                Ok(yld) => Response::builder().body(yld),
                Err(msg) => Response::builder().status(400).body(msg),
            }
        });

    let balance = warp::path!("balance")
        .and(warp::body::json())
        .map(|r: BalanceRequest| {
            debug!("Got balance request: {:?}", r);
            match r.balance() {
                Ok(balance) => {
                    let json = warp::reply::json(&balance);
                    warp::reply::with_status(json, StatusCode::OK)
                }
                Err(message) => {
                    let json = warp::reply::json(&ErrorResponse { message });
                    warp::reply::with_status(json, StatusCode::BAD_REQUEST)
                }
            }
        });

    let log = warp::log("stoichkitweb");

    warp::serve(pctyield.or(balance).with(cors).with(log))
        .run(([0, 0, 0, 0], 3030))
        .await;
}
