import React from 'react';
import logo from './logo.svg';
import './App.css';

import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link
} from "react-router-dom";

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

const e = React.createElement;

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
            errorMessage: null
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
            const URL = "http://localhost:3030/yield";
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

    render() {
        let yieldDisplay;
        if (this.state.yield) {
            yieldDisplay = `Yield: ${this.state.yield}`;
        } else if (this.state.errorMessage) {
            yieldDisplay = `Error: ${this.state.errorMessage}`;
        }
        let resultElem =
            <h4 className="mt-4">
                <p>
                    {yieldDisplay}
                </p>
            </h4>;

        return (
            <Form id={"reaction-form"} className={`form`} onSubmit={this.onSubmit}>
                <div className={`d-flex flex-row`}>
                    <div>
                        {this.rglist()}
                        <div className={`d-flex flex-row justify-content-between`}>
                            <Button onClick={this.addReagent}>Add A Reagent</Button>
                            <Button onClick={this.removeReagent} className={"btn-secondary"}>Remove A Reagent</Button>
                        </div>
                    </div>
                    <p className={`mr-2 ml-2`}>=</p>
                    <div>
                        {this.p()}
                        <Button type={`submit`} className={`btn-success float-right`}>Submit</Button>
                    </div>
                </div>
                {resultElem}
            </Form>
        )
    }
}

function App() {
    let router = (
            <Router>
                <div>
                    <nav>
                        <ul>
                            <li>
                                <Link to="/">Home</Link>
                            </li>
                            <li>
                                <Link to="/about">About</Link>
                            </li>
                            <li>
                                <Link to="/users">Users</Link>
                            </li>
                        </ul>
                    </nav>

                    {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
                    <Switch>
                        <Route path="/about">
                            <About />
                        </Route>
                        <Route path="/users">
                            <Users />
                        </Route>
                        <Route path="/">
                            <Home />
                        </Route>
                    </Switch>
                </div>
            </Router>
        );

    function Home() {
        return <h2>Home</h2>;
    }

    function About() {
        return <h2>About</h2>;
    }

    function Users() {
        return <h2>Users</h2>;
    }

  return (
    <div className="App">
      <div className="container col-md-8">
          <h3>Percent Yield Calculator</h3>
          <ReactionForm/>
      </div>
    </div>
  )
}

export default App;
