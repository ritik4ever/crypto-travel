// components/Header.js
import React from 'react';

function Header() {
    return (
        <header className="app-header">
            <div className="logo">
                <h1>CryptoTravel</h1>
                <span>Flight booking with crypto payments</span>
            </div>
            <nav>
                <ul>
                    <li>Flights</li>
                    <li>Hotels</li>
                    <li>Car Rental</li>
                    <li>Support</li>
                </ul>
            </nav>
        </header>
    );
}

export default Header;