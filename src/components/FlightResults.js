import React from 'react';

function FlightResults({ results, onSelectFlight, wallet }) {
    if (results.length === 0) {
        return <div className="no-results">Search for flights to see results</div>;
    }

    return (
        <div className="flight-results">
            <h2>{results.length} flights found</h2>

            {results.map((flight, index) => (
                <div key={index} className="flight-card">
                    <div className="flight-header">
                        <div className="airline">
                            <img src={flight.airline.logo} alt={flight.airline.name} />
                            <span>{flight.airline.name}</span>
                        </div>
                        <div className="flight-price">
                            <div className="fiat-price">${flight.price.fiat}</div>
                            <div className="crypto-price">
                                {flight.price.eth} ETH
                                {wallet && <span> (≈ ${(flight.price.eth * 3000).toFixed(2)})</span>}
                            </div>
                        </div>
                    </div>

                    <div className="flight-details">
                        <div className="flight-time">
                            <div className="time">{flight.departure.time}</div>
                            <div className="city">{flight.departure.city}</div>
                            <div className="airport">{flight.departure.airport}</div>
                        </div>

                        <div className="flight-duration">
                            <div className="duration">{flight.duration}</div>
                            <div className="flight-line">
                                <span className="dot"></span>
                                <hr />
                                <span className="dot"></span>
                            </div>
                            <div className="stops">{flight.stops === 0 ? 'Direct' : `${flight.stops} stop(s)`}</div>
                        </div>

                        <div className="flight-time">
                            <div className="time">{flight.arrival.time}</div>
                            <div className="city">{flight.arrival.city}</div>
                            <div className="airport">{flight.arrival.airport}</div>
                        </div>
                    </div>

                    <button
                        className="select-button"
                        onClick={() => onSelectFlight(flight)}
                        disabled={!wallet}
                    >
                        {wallet ? 'Select Flight' : 'Connect Wallet to Book'}
                    </button>
                </div>
            ))}
        </div>
    );
}

export default FlightResults;
