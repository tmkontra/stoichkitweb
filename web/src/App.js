import React, {useState} from 'react';
import './App.css';

import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    NavLink
} from "react-router-dom";

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal';
import Collapse from 'react-bootstrap/Collapse';

const e = React.createElement;

let API_URL;
if(process.env.NODE_ENV === 'development') {
    API_URL = 'http://localhost:3030';
}

if(process.env.NODE_ENV === 'production') {
    API_URL = process.env.API_URL || "https://stoichkitweb.com/api";
}

function resultDiv(title, content) {
    let className = `mt-4 shadow-lg p-3 bg-white rounded`;
    let style = {flexGrow: 1, position: "relative", zIndex: 10};
    return <div className={className} style={style}>
        <h4>{title}</h4>
        {content}
    </div>
}

class ReactionForm extends React.Component {
    newReagent = () => {
        return {
            formula: "",
            mass: null,
            coeff: 1,
        }
    };

    constructor(props) {
        super(props);
        this.state = {
            reagents: [this.newReagent()],
            product: this.newReagent(),
            yield: null,
            errorMessage: null,
        };
    }

    rglist = () => {
        var inputs = this.state.reagents.map((rg, i) => {
            const updateFormula = (event) => {
                let reagents = [...this.state.reagents];
                reagents[i].formula = event.target.value;
                this.setState({
                    ...this.state,
                    reagents: reagents
                })
            };
            const updateMass = (event) => {
                let reagents = [...this.state.reagents];
                reagents[i].mass = Number(event.target.value);
                this.setState({
                    ...this.state,
                    reagents: reagents
                })
            };
            const updateCoeff = (event) => {
                let reagents = [...this.state.reagents];
                reagents[i].coeff = Number(event.target.value);
                this.setState({
                    ...this.state,
                    reagents: reagents
                })
            };
            return (
                <Form.Group className="d-flex">
                    <Form.Control type="number"
                                  className={["coeff"]}
                                  placeholder={1}
                                  value={this.state.reagents[i].coeff}
                                  onChange={updateCoeff}
                    />
                    <p className={"mr-2 ml-2"}>∗</p>
                    <Form.Control type={"text"}
                                  className={"formula"}
                                  placeholder={"formula"}
                                  value={this.state.reagents[i].formula}
                                  onChange={updateFormula}
                                  required
                    />
                    <p className={"mr-2 ml-2"}>×</p>
                    <Form.Control type="number"
                                  step="any"
                                  className={["mass"]}
                                  placeholder={"amount (g)"}
                                  value={this.state.reagents[i].mass}
                                  onChange={updateMass}
                                  required
                    />
                </Form.Group>
            )
        });
        return inputs
    };

    p = () => {
        const updateFormula = (event) => {
            var product = this.state.product;
            this.setState({
                ...this.state,
                product: {
                    ...product,
                    formula: event.target.value
                }
            })
        };
        const updateMass = (event) => {
            var product = this.state.product;
            this.setState({
                ...this.state,
                product: {
                    ...product,
                    mass: Number(event.target.value)
                }
            })
        };
        const updateCoeff = (event) => {
            var product = this.state.product;
            this.setState({
                ...this.state,
                product: {
                    ...product,
                    coeff: Number(event.target.value)
                }
            })
        };
        return (
            <Form.Group className="d-flex">
                <Form.Control type="number"
                              className={["coeff"]}
                              placeholder={1}
                              value={this.state.product.coeff}
                              onChange={updateCoeff}
                />
                <p className={"mr-2 ml-2"}>∗</p>
                <Form.Control type={"text"}
                              className={"formula"}
                              placeholder={"formula"}
                              value={this.state.product.formula}
                              onChange={updateFormula}
                              required
                />
                <p className={"mr-2 ml-2"}>×</p>
                <Form.Control type="number"
                              step="any"
                              className={["mass"]}
                              placeholder={"amount (g)"}
                              value={this.state.product.mass}
                              onChange={updateMass}
                              required
                />
            </Form.Group>
        )
    };

    addReagent = (ev) => {
        ev.preventDefault();
        this.setState({
            reagents: [
                ...this.state.reagents,
                this.newReagent()
            ]
        })
    };

    removeReagent = (ev) => {
        ev.preventDefault();
        if (this.state.reagents.length > 1){
            this.setState({
                reagents: this.state.reagents.slice(0, -1)
            })
        }
    };

    onSubmit = (ev) => {
        const form = ev.currentTarget;
        if (form.checkValidity() === true) {
            const URL = `${API_URL}/yield`;
            fetch(
                URL,
                {
                    mode: 'cors',
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.state)
                }
            )
                .then(res =>
                    res.text().then(text => [res.ok, text])
                )
                .then(
                    ([ok, content]) => {
                        if (ok) {
                            this.setState({
                                ...this.state,
                                yield: content,
                                errorMessage: null,
                            });
                        } else {
                            this.setState({
                                ...this.state,
                                yield: null,
                                errorMessage: content
                            })
                        }
                    },
                )
        }
        ev.preventDefault();
    };

    renderResult = () => {
        if (this.state.yield) {
            return resultDiv("Yield",
                <h5>{this.state.yield}</h5>
            )
        } else if (this.state.errorMessage) {
            return resultDiv("Error",
                <h5>{this.state.errorMessage}</h5>
            )
        }
    };

    render() {
        let resultElem = this.renderResult();

        return (
            <Form id={"reaction-form"} className={`form`} onSubmit={this.onSubmit}>
                <div className={`d-flex flex-row justify-content-between flex-wrap`}>
                    <div className={`mb-3 yield-group`}>
                        <h4>Reactants</h4>
                        {this.rglist()}
                        <div className={`d-flex flex-row justify-content-between button-row`}>
                            <Button onClick={this.addReagent}>Add A Reactant</Button>
                            <Button onClick={this.removeReagent} className={"btn-secondary"}>Remove A Reactant</Button>
                        </div>
                    </div>
                    <div className={`yield-divider`}>
                        <p className={`align-middle mr-2 ml-2`} style={{display: "inline"}}>=</p>
                    </div>
                    <div className={`yield-group`}>
                        <h4>Products</h4>
                        {this.p()}
                        <Button type={`submit`} className={`btn-success float-right`}>Submit</Button>
                    </div>
                </div>
                {resultElem}
            </Form>
        )
    }
}

const IMPORT_REACTION_COLLAPSIBLE_ID = "importReactionCollapse";

function ChemdrawReactionModal(props) {
    const [show, setShow] = useState(false);
    const [reaction, setReaction] = useState(null);

    const handleClose = () => {
        props.submitChemdrawReaction(reaction);
        setShow(false);
        props.cleanup();
    };

    const handleShow = () => setShow(true);

    return (
        <>
        <Button variant="primary" onClick={handleShow}>
            {props.name}
        </Button>
        <Modal show={show} onHide={handleClose} animation={false}>
            <Modal.Header closeButton>
                <Modal.Title>Import Chemdraw Reaction</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Control type={`text`}
                              placeholder={`Paste Chemdraw Reaction Here`}
                              value={reaction}
                              onChange={(ev) => setReaction(ev.target.value)}
                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="success" onClick={handleClose}>
                    Submit
                </Button>
            </Modal.Footer>
        </Modal>
        </>
    )
};

class BalanceForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            reagents: [''],
            products: [''],
            importExpanded: false,
        };
    }

    addReagent = (ev) => {
        this.setState({
            ...this.state,
            reagents: this.state.reagents.concat([''])
        });
    };

    removeReagent = (ev) => {
        let sliced = this.state.reagents.slice(0,-1);
        this.setState({
            ...this.state,
            reagents: sliced.length ? sliced : ['']
        });
    };

    addProduct = (ev) => {
        this.setState({
            ...this.state,
            products: this.state.products.concat([''])
        })
    };

    removeProduct = (ev) => {
        let sliced = this.state.products.slice(0,-1);
        this.setState({
            ...this.state,
            products: sliced.length ? sliced : ['']
        })
    };

    onSubmit = (ev) => {
        const form = ev.currentTarget;
        const URL = `${API_URL}/balance`;
        if(form.checkValidity()) {
            fetch(
                URL,
                {
                    mode: 'cors',
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.state)
                }
            )
                .then(res =>
                    res.json().then(text => [res.ok, text])
                )
                .then(
                    ([ok, content]) => {
                        if (ok) {
                            this.setState({
                                balanced: content,
                                errorMessage: null,
                            });
                        } else {
                            this.setState({
                                balanced: null,
                                errorMessage: content.message
                            })
                        }
                    },
                )
                .catch((_e) =>
                    this.setState({
                        balanced: null,
                        errorMessage: "Could not complete request. Please try again later."
                    })
                )
            ev.preventDefault();
        }
    };

    renderEq = (reagents, products) => {
      let r = reagents.map( (r) => {
        return `${r[1]} ${r[0]}`
      });
      let p = products.map( (p) => {
        return `${p[1]} ${p[0]}`
      });
      return <div className={`d-flex flex-row justify-content-around`}>
          <p>{r.join(" + ")}</p>
          <p>=</p>
          <p>{p.join(" + ")}</p>
      </div>
    };

    ev = () => {
        if (this.state.balanced) {
            return resultDiv("Balanced Equation",
                <div>
                    <h2>{this.renderEq(this.state.balanced.reagents, this.state.balanced.products)}</h2>
                </div>
            )
        } else if (this.state.errorMessage) {
            return resultDiv("Error",
                <h2>{this.state.errorMessage}</h2>
            )
        }
    };

    submitChemdrawReaction = (reactionString) => {
        const URL = `${API_URL}/chemdraw`;
        if (reactionString) {
            fetch(
                URL,
                {
                    mode: 'cors',
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: reactionString
                }
            )
                .then(res =>
                    res.json().then(text => [res.ok, text])
                )
                .then(
                    ([ok, content]) => {
                        if (ok) {
                            let update = {
                                reagents: content.reactants,
                                products: content.products,
                            };
                            console.log(update);
                            this.setState({
                                ...this.state,
                                ...update,
                                errorMessage: null,
                            });
                            console.log(this.state);
                        } else {
                            this.setState({
                                ...this.state,
                                balanced: null,
                                errorMessage: content.message
                            })
                        }
                    }
                )
                .catch((_e) =>
                    this.setState({
                        ...this.state,
                        balanced: null,
                        errorMessage: "Could not complete request. Please try again later."
                    })
                )
        }
    };

    setImportExpanded = (importExpanded) => {
        this.setState({
            ...this.state,
            importExpanded: importExpanded
        })
    };

    render() {
        return (
                <div>
                    <p>
                        <a className="btn btn-outline-primary nohover" type="button"
                           aria-expanded={this.state.importExpanded}
                           aria-controls={IMPORT_REACTION_COLLAPSIBLE_ID}
                           onClick={() => this.setImportExpanded(!this.state.importExpanded)}
                        >
                            <svg width="1em" height="1em" viewBox="0 0 16 16" className="bi bi-arrow-down-short"
                                 fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd"
                                      d="M4.646 7.646a.5.5 0 0 1 .708 0L8 10.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z"/>
                                <path fill-rule="evenodd"
                                      d="M8 4.5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5z"/>
                            </svg>
                            Import A Reaction
                        </a>
                    </p>
                    <Collapse in={this.state.importExpanded}>
                        <div id={IMPORT_REACTION_COLLAPSIBLE_ID} style={{margin: 0, padding: 0}}>
                            <ChemdrawReactionModal name={"Chemdraw Reaction"}
                                                   submitChemdrawReaction={this.submitChemdrawReaction}
                                                   cleanup={() => this.setImportExpanded(false)}
                            />
                            <hr/>
                        </div>
                    </Collapse>
                <Form id={"reaction-form"} className={`form`} onSubmit={this.onSubmit}>
                    <div className={`d-flex flex-row`}>
                        <div style={{flexGrow: 1}} className={`mr-2`}>
                            <h3>Reactants</h3>
                            <Form.Group>
                                {
                                    this.state.reagents.map((r, i) => {
                                        const update = (ev) => {
                                            let reagents = [...this.state.reagents];
                                            reagents[i] = ev.target.value;
                                            this.setState({
                                                ...this.state,
                                                reagents: reagents
                                            })

                                        };
                                        return <Form.Control value={this.state.reagents[i]}
                                                             onChange={update}
                                                             type={"text"}
                                                             className={`mb-2`}
                                                             required/>
                                    })
                                }
                            </Form.Group>
                            <div className={`d-flex flex-row justify-content-between button-row`}>
                                <Button onClick={this.addReagent}>
                                    Add A Reactant
                                </Button>
                                <Button className={`btn btn-secondary`} onClick={this.removeReagent}>
                                    Remove A Reactant
                                </Button>
                            </div>
                        </div>
                        <div style={{flexGrow: 1}} className={`ml-2`}>
                            <h3>Products</h3>
                            <Form.Group>
                                {
                                    this.state.products.map((r, i) => {
                                        const update = (ev) => {
                                            let products = [...this.state.products];
                                            products[i] = ev.target.value;
                                            this.setState({
                                                ...this.state,
                                                products: products
                                            })

                                        };
                                        return <Form.Control type={"text"}
                                                             value={this.state.products[i]}
                                                             onChange={update}
                                                             className={`mb-2`}
                                                             required/>
                                    })
                                }
                            </Form.Group>
                            <div className={`d-flex flex-row justify-content-between button-row`}>
                                <Button onClick={this.addProduct} className={`py-auto`}>
                                    Add A Product
                                </Button>
                                <Button className={`btn btn-secondary`} onClick={this.removeProduct}>
                                    Remove A Product
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className={`d-flex flex-row-reverse`}>
                        <Button className={`btn btn-success mt-4`} type={`submit`}>
                            Submit
                        </Button>
                    </div>
                </Form>
                    <div className={`d-flex flex-row`}>
                    {this.ev()}
                </div>
            </div>
        )
    }
}

function App() {
    let header = (
        <Router>
            <header className="App-header">
                <nav className="navbar navbar-expand-lg navbar-light bg-light static-top">
                    <div className="container">
                        <Link className="navbar-brand" to="/">StoichKit Web</Link>
                        <button className="navbar-toggler"
                                type="button"
                                data-toggle="collapse"
                                data-target="#navbarResponsive">
                            <span className="navbar-toggler-icon"></span>
                        </button>

                        <div className="collapse navbar-collapse flex-grow-0" id="navbarResponsive">
                            <ul className="navbar-nav ml-auto text-right">
                                <li className="nav-item">
                                    <NavLink to={"/yield"} className={`nav-link`} activeClassName={`active`}>
                                        Percent Yield
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to={"/balance"} className={`nav-link`} activeClassName={`active`}>
                                        Equation Balancer
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to={"about"} className={`nav-link`} activeClassName={`active`}>
                                        About
                                    </NavLink>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>
            </header>
            <div className="container col-md-8 mt-4">
                <Switch>
                    <Route path="/yield">
                        <h2>Percent Yield Calculator</h2>
                        <ReactionForm />
                    </Route>
                    <Route path="/balance">
                        <h2>Chemical Equation Balancer</h2>
                        <BalanceForm />
                    </Route>
                    <Route path="/about">
                        <About />
                    </Route>
                    <Route path="/">
                        <Home />
                    </Route>
                </Switch>
            </div>
        </Router>

    );

    function Home() {
        let yldCard = (
            <Card className={`m-2`}>
                <Card.Body>
                    <Link to={'/yield'}>
                    <Card.Title>Percent Yield Calculator</Card.Title>
                    </Link>
                    <Card.Text>
                        Given reactants and the product, determine the yield
                    </Card.Text>
                </Card.Body>
            </Card>
        );
        let balanceCard = (
            <Card className={`m-2`}>
                <Card.Body>
                    <Link to={'/balance'}>
                    <Card.Title>Equation Balancer</Card.Title>
                    </Link>
                    <Card.Text>
                        Given reactants and products, balance the equation
                    </Card.Text>
                </Card.Body>
            </Card>
        );
        return (
            <div className={`d-flex flex-row justify-content-around`}>
                {yldCard}
                {balanceCard}
            </div>
        )
    }

    function About() {
        return [
            <h2>About StoichKit Web</h2>,
            <div>
                <p>
                    StoichKit Web is a free chemistry toolkit powered by the Open Source
                    <a href={"https://github.com/ttymck/stoichkit"}> stoichkit</a> library.
                </p>
                <p>
                    The stoichkit library is written in Rust and should be usable across Linux, macOS and Windows.
                    The library is developed on macOS, and if you are interested in compiling stoichkit for Linux and Windows,
                    we would be happy to receive any compatibility bug reports.
                </p>
                <p>If you encounter any issues using StoichKit Web, please submit an issue <a href={"https://github.com/ttymck/stoichkitweb/issues"}>here</a>.</p>
            </div>
        ];
    }

    function Users() {
        return <h2>Users</h2>;
    }

  let app =  (
    <div className="App">
      <div className="container col-md-8">
          <h3>Percent Yield Calculator</h3>
          <ReactionForm/>
      </div>
    </div>
  );
    return header
}

export default App;
