"use client";

import { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ArrowLine, ExitIcon, WalletIcon } from "./SvgIcon";

const WalletButton: FC = () => {
  const { setVisible } = useWalletModal();
  const { publicKey, disconnect } = useWallet();
  return (
    <button className="relative border-[0.75px] border-primary-300 bg-primary-400 shadow-btn-inner px-2 py-2 rounded-lg w-[140px] lg:w-[180px] text-primary-100 tracking-[0.32px] group">
      {publicKey ? (
        <>
          <div className="flex justify-center items-center text-[12px] lg:text-[16px]">
            {publicKey.toBase58().slice(0, 4)}....
            {publicKey.toBase58().slice(-4)}
            <div className="w-3 h-3 rotate-90">
              <ArrowLine />
            </div>
          </div>
          <div className="group-hover:block top-[34px] left-0 absolute hidden w-[140px] lg:w-[180px]">
            <ul className="flex flex-col gap-2 border-[#89C7B5] border-[0.75px] bg-[#162923] mt-2 p-2 rounded-lg">
              <li>
                <button
                  className="flex items-center gap-2 text-primary-100 tracking-[-0.32px]"
                  onClick={() => setVisible(true)}
                >
                  <WalletIcon /> Change Wallet
                </button>
              </li>
              <li>
                <button
                  className="flex items-center gap-2 text-primary-100 tracking-[-0.32px]"
                  onClick={disconnect}
                >
                  <ExitIcon /> Disconnect
                </button>
              </li>
            </ul>
          </div>
        </>
      ) : (
        <div
          className="flex justify-center items-center gap-1 text-[12px] lg:text-[16px]"
          onClick={() => setVisible(true)}
        >
          Connect wallet <ArrowLine />
        </div>
      )}
      {}
    </button>
  );
};

export default WalletButton;
