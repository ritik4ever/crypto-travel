import React from 'react';

function ConnectWallet({ wallet, connectWallet }) {
    return (
        <div className="wallet-connector">
            {wallet ? (
                <div className="wallet-info">
                    <div className="wallet-address">
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </div>
                    <div className="wallet-balance">
                        {parseFloat(wallet.balance).toFixed(4)} ETH
                    </div>
                </div>
            ) : (
                <button className="connect-button" onClick={connectWallet}>
                    Connect Wallet
                </button>
            )}
        </div>
    );
}

export default ConnectWallet;