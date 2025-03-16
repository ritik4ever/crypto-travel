
// components/SearchForm.js
import React, { useState } from 'react';

function SearchForm({ onSearch }) {
    const [searchParams, setSearchParams] = useState({
        from: '',
        to: '',
        departDate: '',
        returnDate: '',
        passengers: 1,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(searchParams);
    };

    return (
        <div className="search-form">
            <h2>Find flights with cryptocurrency payment</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label>From</label>
                        <input
                            type="text"
                            name="from"
                            placeholder="Departure city"
                            value={searchParams.from}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>To</label>
                        <input
                            type="text"
                            name="to"
                            placeholder="Arrival city"
                            value={searchParams.to}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Depart</label>
                        <input
                            type="date"
                            name="departDate"
                            value={searchParams.departDate}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Return</label>
                        <input
                            type="date"
                            name="returnDate"
                            value={searchParams.returnDate}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Passengers</label>
                        <select
                            name="passengers"
                            value={searchParams.passengers}
                            onChange={handleChange}
                        >
                            {[1, 2, 3, 4, 5, 6].map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button type="submit" className="search-button">Search Flights</button>
            </form>
        </div>
    );
}

export default SearchForm;