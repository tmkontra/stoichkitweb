use warp::Filter;

use serde::{Deserialize, Serialize};
use stoichkit::model::{Reaction, Substance};

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

#[tokio::main]
async fn main() {
    env_logger::init();

    let cors = warp::cors()
        .allow_any_origin()
        .allow_methods(vec!["GET", "POST"])
        .build();
    // GET /hello/warp => 200 OK with body "Hello, warp!"
    let pctyield = warp::path!("yield")
        .and(warp::body::json())
        .map(|r: ReactionRequest| {
            r.reaction()
                .map(|r| r.percent_yield())
                .map(|y| format!("{}", y))
                .unwrap_or_else(|e| e)
        })
        .with(cors);

    let serve_static = warp::fs::dir("./web");

    let serve_index =
        warp::path::end().and(warp::fs::file("./web/index.html"));

    let log = warp::log("stoichkitweb");

    warp::serve(pctyield.or(serve_index).or(serve_static)
        .with(log))
        .run(([0, 0, 0, 0], 3030))
        .await;
}
