"use client";

import Header from "@/components/Header";
import ProSidebar from "@/components/ProSidebar";
import { SelectorIcon } from "@/components/SelectorIcon";
import { createMarket, createPool } from "@/lib/txHandler";
import { getTokenList, solanaConnection } from "@/lib/utils";
import { DateValue, parseAbsoluteToLocal } from "@internationalized/date";
import {
  Button,
  DatePicker,
  Input,
  Select,
  SelectedItems,
  SelectItem,
  Switch,
  useDisclosure,
} from "@nextui-org/react";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useState, useEffect } from "react";
import { CiCirclePlus } from "react-icons/ci";
import { toastError, toastSuccess, useAppContext } from "../context/AppContext";

const standList = [
  { key: "0", label: "2.8 SOL" },
  { key: "1", label: "1.5 SOL" },
  { key: "2", label: "0.4 SOL" },
];

const lengthList = [
  { event: 2978, request: 63, order: 909 },
  { event: 1400, request: 63, order: 450 },
  { event: 128, request: 9, order: 201 },
];

export default function Home() {
  const { wallet, anchorWallet } = useAppContext();

  const [tokenAddress, setTokenAddress] = useState("");
  const [lpWallet, setLpWallet] = useState("");
  const [keypair, setKeypair] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [started, setStarted] = useState(false);
  const [stopFlag, setStopFlag] = useState(false);
  const [marketloading, setMarketLoading] = useState(false);
  const [lpLoading, setLpLoading] = useState(false);
  const [tokenList, setTokenList] = useState([]);

  // Open Book Market Section

  const [baseToken, setBaseToken] = useState("");
  const [quoteToken, setQuoteToken] = useState("");
  const [baseTokenMeta, setBaseTokenMeta] = useState<any>();
  const [quoteTokenMeta, setQuoteTokenMeta] = useState<any>();
  const [orderSize, setMinOrderSize] = useState(1);
  const [tickSize, setTickSize] = useState(0.0001);
  const [standard, setStandard] = useState(1);
  const [eventLength, setEventLength] = useState(2978);
  const [requestLength, setRequestLength] = useState(63);
  const [orderBookLength, setOrderBookLength] = useState(909);
  const [marketID, setMarketID] = useState("");

  // LP Section
  const [baseTokenAmount, setBaseTokenAmount] = useState(0);
  const [quoteTokenAmount, setQuoteTokenAmount] = useState(0);

  // Sell Token

  const [isSelected, setIsSelected] = useState(true);
  const [isTimeSelected, setIsTimeSelected] = useState(true);
  const [fetchFlag, setFetchFlag] = useState(false);

  const [isClient, setIsClient] = useState(false);

  const currentDate = new Date();
  let [date, setDate] = useState<DateValue>(
    parseAbsoluteToLocal(currentDate.toISOString())
  );

  const getNfts = async () => {
    if (!anchorWallet) return [];
    setFetchFlag(true);
    const list = await getTokenList(anchorWallet.publicKey);
    setFetchFlag(false);
    setTokenList(list);
  };

  useEffect(() => {
    (async () => {
      await getNfts();
    })();
  }, [anchorWallet]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const changeBase = async (mintAddress: string) => {
    const filtered: any = tokenList.filter(
      (item: any) => item.mint == mintAddress
    );

    if (filtered.length > 0 && anchorWallet) {
      setBaseToken(mintAddress);
      setBaseTokenMeta(filtered[0]);
    } else {
      setBaseToken("");
      setBaseTokenMeta({});
    }
  };

  const changeStandard = async (value: string) => {
    setEventLength(lengthList[Number(value)].event);
    setRequestLength(lengthList[Number(value)].request);
    setOrderBookLength(lengthList[Number(value)].order);
  };

  const changeQuote = async (mintAddress: string) => {
    const filtered: any = tokenList.filter(
      (item: any) => item.mint == mintAddress
    );

    if (filtered.length > 0 && anchorWallet) {
      setQuoteToken(mintAddress);
      setQuoteTokenMeta(filtered[0]);
    } else {
      setQuoteToken("");
      setQuoteTokenMeta({});
    }
  };

  const createMarketTx = async () => {
    if (!wallet.publicKey) {
      toastError("Wallet not connected!");
      return;
    }

    if (baseToken == "") {
      toastError("You shoule select base token!");
      return;
    }

    if (quoteToken == "") {
      toastError("You shoule select quote token!");
      return;
    }

    setMarketLoading(true);
    const res = await createMarket({
      baseMint: new PublicKey(baseToken),
      quoteMint: new PublicKey(quoteToken),
      url: "devnet",
      orderSize: orderSize,
      priceTick: tickSize,
      wallet: anchorWallet,
      eventLength,
      requestLength,
      orderBookLength,
    });

    if (res) {
      if (anchorWallet) {
        try {
          setMarketID(res.marketId);

          // let stx1 = (await anchorWallet.signTransaction(res.tx1)).serialize();
          // let stx2 = (await anchorWallet.signTransaction(res.tx2)).serialize();
          // let stx3 = (await anchorWallet.signTransaction(res.tx3)).serialize();

          const transactions = [res.tx1, res.tx2, res.tx3];
          const singedtransactions = await anchorWallet.signAllTransactions(
            transactions
          );

          const options = {
            commitment: "confirmed",
            skipPreflight: true,
          };

          const txId1 = await solanaConnection.sendRawTransaction(
            singedtransactions[0].serialize(),
            options
          );
          await solanaConnection.confirmTransaction(txId1, "confirmed");
          // toastSuccess(`${mintTokenSupply} token minted successfully!`);
          console.log("txId1======>>", txId1);

          const txId2 = await solanaConnection.sendRawTransaction(
            singedtransactions[1].serialize(),
            options
          );
          await solanaConnection.confirmTransaction(txId1, "confirmed");
          console.log("txId2======>>", txId2);

          const txId3 = await solanaConnection.sendRawTransaction(
            singedtransactions[2].serialize(),
            options
          );
          await solanaConnection.confirmTransaction(txId3, "confirmed");
          console.log("txId3======>>", txId3);

          toastSuccess(`MarketID: ${res.marketId} created successfully!`);

          setMarketLoading(false);

          setLpLoading(true);

          const res1 = await createPool({
            marketId: new PublicKey(res.marketId),
            baseMintAmount: baseTokenAmount,
            url: "devnet",
            quoteMintAmount: quoteTokenAmount,
            wallet: anchorWallet,
            launchTime: date,
          });

          if (res1) {
            if (anchorWallet) {
              try {
                let stx = (
                  await anchorWallet.signTransaction(res1.tx)
                ).serialize();

                const options = {
                  commitment: "confirmed",
                  skipPreflight: true,
                };

                const txId = await solanaConnection.sendRawTransaction(
                  stx,
                  options
                );
                await solanaConnection.confirmTransaction(txId, "confirmed");
                // toastSuccess(`${mintTokenSupply} token minted successfully!`);
                console.log("txId======>>", txId);

                toastSuccess(`PoolID: ${res1.poolId} created successfully!`);
                setLpLoading(false);
              } catch (error: any) {
                toastError(`${error.message}`);
                setMarketID("");
                setLpLoading(false);
              }
            }
          }
        } catch (error: any) {
          toastError(`${error.message}`);
          setMarketID("");
          setMarketLoading(false);
        }
      }
    }
  };

  const validator = async () => {
    if (baseToken == "") {
      toastError("Select the base token!");
      return false;
    }
    if (quoteToken == "") {
      toastError("Select the quote token!");
      return false;
    }
    if (orderSize <= 0) {
      toastError("Please enter the correct order size");
      return false;
    }
    if (tickSize <= 0) {
      toastError("Please enter the correct ticker size");
      return false;
    }
    if (baseTokenAmount <= 0) {
      toastError("Please enter the correct base token amount");
      return false;
    }
    if (quoteTokenAmount <= 0) {
      toastError("Please enter the correct quote token amount");
      return false;
    }
    if (baseToken == quoteToken) {
      toastError("Base token is same with quote token!");
      return false;
    }

    return true;
  };

  const createLP = async () => {
    const validationFlag = await validator();
    if (validationFlag == false) {
      return;
    }
    await createMarketTx();
  };

  return (
    <main
      className={`flex flex-col min-h-screen px-16 py-6 bg-[#f0f4fd] font-IT w-full gap-5 h-screen text-black`}
    >
      <Header />
      <div className="flex gap-6 w-full h-wull">
        <ProSidebar />
        <div className="flex flex-col justify-start items-center bg-white p-5 rounded-xl w-full h-full">
          <span className="flex justify-center w-full font-bold text-[25px] text-center">
            Create Liquidity Pool
          </span>
          <div className="flex justify-start pt-5 w-full text-[18px]">
            Create OpenBook Market
          </div>
          <div className="gap-6 grid grid-cols-12 pt-5 w-full">
            <Select
              isRequired
              label="Base Token"
              placeholder="Select the Token"
              labelPlacement="outside"
              items={tokenList}
              isLoading={fetchFlag}
              className="col-span-6"
              disableSelectorIconRotation
              selectorIcon={<SelectorIcon />}
              onChange={(e) => {
                changeBase(e.target.value);
              }}
              renderValue={(items: SelectedItems<any>) => {
                return items.map((item: any) => (
                  <div
                    key={item.data.mint}
                    className="flex justify-between items-center gap-2 w-full font-IT"
                  >
                    <img
                      src={
                        item.data.mint !=
                        "So11111111111111111111111111111111111111112"
                          ? item.data.image
                          : "https://statics.solscan.io/cdn/imgs/s60?ref=68747470733a2f2f7261772e67697468756275736572636f6e74656e742e636f6d2f736f6c616e612d6c6162732f746f6b656e2d6c6973742f6d61696e2f6173736574732f6d61696e6e65742f536f31313131313131313131313131313131313131313131313131313131313131313131313131313131322f6c6f676f2e706e67"
                      }
                      alt=""
                      className="w-[30px] h-[30px]"
                    />
                    <div>
                      {}
                      {item.data.mint}
                    </div>
                    <div>
                      {item.data.mint !=
                      "So11111111111111111111111111111111111111112"
                        ? item.data.symbol
                        : "WSOL"}
                    </div>
                  </div>
                ));
              }}
            >
              {(item) => (
                <SelectItem key={item.mint} textValue={item.updateAuthority}>
                  <div className="flex justify-between items-center w-full font-IT">
                    <img
                      src={
                        item.mint !=
                        "So11111111111111111111111111111111111111112"
                          ? item.image
                          : "https://statics.solscan.io/cdn/imgs/s60?ref=68747470733a2f2f7261772e67697468756275736572636f6e74656e742e636f6d2f736f6c616e612d6c6162732f746f6b656e2d6c6973742f6d61696e2f6173736574732f6d61696e6e65742f536f31313131313131313131313131313131313131313131313131313131313131313131313131313131322f6c6f676f2e706e67"
                      }
                      alt=""
                      className="w-[30px] h-[30px]"
                    />
                    <div>
                      {/* {truncateText(item.mint, 4)} */}
                      {item.mint}
                    </div>
                    <div>
                      {item.mint !=
                      "So11111111111111111111111111111111111111112"
                        ? item.symbol
                        : "WSOL"}
                    </div>
                  </div>
                </SelectItem>
              )}
            </Select>
            <Select
              isRequired
              label="Quote Token"
              placeholder="Select the Token"
              labelPlacement="outside"
              items={tokenList}
              isLoading={fetchFlag}
              className="col-span-6"
              disableSelectorIconRotation
              selectorIcon={<SelectorIcon />}
              onChange={(e) => {
                changeQuote(e.target.value);
              }}
              renderValue={(items: SelectedItems<any>) => {
                return items.map((item: any) => (
                  <div
                    key={item.data.mint}
                    className="flex justify-between items-center gap-2 w-full font-IT"
                  >
                    <img
                      src={
                        item.data.mint !=
                        "So11111111111111111111111111111111111111112"
                          ? item.data.image
                          : "https://statics.solscan.io/cdn/imgs/s60?ref=68747470733a2f2f7261772e67697468756275736572636f6e74656e742e636f6d2f736f6c616e612d6c6162732f746f6b656e2d6c6973742f6d61696e2f6173736574732f6d61696e6e65742f536f31313131313131313131313131313131313131313131313131313131313131313131313131313131322f6c6f676f2e706e67"
                      }
                      alt=""
                      className="w-[30px] h-[30px]"
                    />
                    <div>
                      {/* {truncateText(item.mint, 4)} */}
                      {item.data.mint}
                    </div>
                    <div>
                      {item.data.mint !=
                      "So11111111111111111111111111111111111111112"
                        ? item.data.symbol
                        : "WSOL"}
                    </div>
                  </div>
                ));
              }}
            >
              {(item) => (
                <SelectItem key={item.mint} textValue={item.updateAuthority}>
                  <div className="flex justify-between items-center w-full font-IT">
                    <img
                      src={
                        item.mint !=
                        "So11111111111111111111111111111111111111112"
                          ? item.image
                          : "https://statics.solscan.io/cdn/imgs/s60?ref=68747470733a2f2f7261772e67697468756275736572636f6e74656e742e636f6d2f736f6c616e612d6c6162732f746f6b656e2d6c6973742f6d61696e2f6173736574732f6d61696e6e65742f536f31313131313131313131313131313131313131313131313131313131313131313131313131313131322f6c6f676f2e706e67"
                      }
                      alt=""
                      className="w-[30px] h-[30px]"
                    />
                    <div>
                      {/* {truncateText(item.mint, 4)} */}
                      {item.mint}
                    </div>
                    <div>
                      {item.mint !=
                      "So11111111111111111111111111111111111111112"
                        ? item.symbol
                        : "WSOL"}
                    </div>
                  </div>
                </SelectItem>
              )}
            </Select>
            <div className="gap-5 grid grid-cols-12 col-span-12">
              <div className="flex justify-center items-center gap-7 col-span-6 bg-[#eee] rounded-xl h-[150px]">
                <div className="flex justify-center items-center gap-4 leading-none">
                  <span className="text-[17px]">Token</span>
                  <Input
                    type="number"
                    radius="sm"
                    defaultValue="1.00"
                    min="0"
                    step={1}
                    className="col-span-3 w-[400px] h-[40px]"
                    onChange={(e) => {
                      setMinOrderSize(Number(e.target.value));
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-center items-center gap-7 col-span-6 bg-[#eee] rounded-xl h-[150px]">
                <div className="flex-gap-4 justify-center items-center leading-none">
                  <span className="text-[17px]">SOL</span>
                  <Input
                    type="number"
                    radius="sm"
                    defaultValue="0.0001000000"
                    step={0.0001}
                    min="0"
                    className="col-span-3 w-[400px] h-[40px]"
                    onChange={(e) => {
                      setTickSize(Number(e.target.value));
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="col-span-12">
              <Switch
                defaultChecked
                isSelected={isSelected}
                onValueChange={setIsSelected}
                size="sm"
              >
                <span className="text-[14px]">Advanced Options</span>
              </Switch>
            </div>
            {isSelected ? (
              <div className="gap-4 grid grid-cols-12 col-span-12">
                <Select
                  isRequired
                  defaultSelectedKeys="0"
                  label="Select a standard OpenBook Market"
                  labelPlacement="outside"
                  className="col-span-3"
                  placeholder="Select the standard"
                  disableSelectorIconRotation
                  selectorIcon={<SelectorIcon />}
                  onChange={(e) => {
                    changeStandard(e.target.value);
                  }}
                >
                  {standList.map((stand) => (
                    <SelectItem key={stand.key}>{stand.label}</SelectItem>
                  ))}
                </Select>
                <Input
                  isRequired
                  type="number"
                  radius="sm"
                  label="Event Queue Length:"
                  labelPlacement={"outside"}
                  defaultValue="128"
                  className="col-span-3 h-[40px]"
                  value={eventLength.toString()}
                  onChange={(e) => {
                    setEventLength(Number(e.target.value));
                  }}
                />
                <Input
                  isRequired
                  type="number"
                  radius="sm"
                  label="Request Queue Length:"
                  labelPlacement={"outside"}
                  defaultValue="63"
                  className="col-span-3 h-[40px]"
                  value={requestLength.toString()}
                  onChange={(e) => {
                    setRequestLength(Number(e.target.value));
                  }}
                />
                <Input
                  isRequired
                  type="number"
                  radius="sm"
                  label="Orderbook Length:"
                  labelPlacement={"outside"}
                  defaultValue="909"
                  className="col-span-3 h-[40px]"
                  value={orderBookLength.toString()}
                  onChange={(e) => {
                    setOrderBookLength(Number(e.target.value));
                  }}
                />
              </div>
            ) : null}
          </div>
          <div className="flex-justify-start pt-5 w-full text-[18px]">Add</div>
          <div className="gap-6 grid grid-cols-12 pt-2 w-full">
            <div className="gap-5 grid grid-cols-11 col-span-12">
              <Input
                isRequired
                type="number"
                radius="sm"
                label="Base Token Amount:"
                labelPlacement={"outside"}
                placeholder="Put the base token amount"
                className="col-span-5 h-[40px]"
                min={0}
                value={baseTokenAmount.toString()}
                onChange={(e) => {
                  setBaseTokenAmount(Number(e.target.value));
                }}
                endContent={
                  <div className="flex gap-3">
                    <div className="flex gap-2 text-[13px]">
                      <span
                        className="border-[2px] hover:bg-[#eee] px-3 p-1 rounded-2xl cursor-pointer"
                        onClick={() => {
                          if (baseTokenMeta) {
                            setBaseTokenAmount(Number(baseTokenMeta.amount));
                          }
                        }}
                      >
                        {" "}
                        Max
                      </span>
                      <span
                        className="border-[2px] hover:bg-[#eee] px-3 p-1 rounded-2xl cursor-pointer"
                        onClick={() => {
                          if (baseTokenMeta) {
                            setBaseTokenAmount(
                              Number(baseTokenMeta.amount / 2)
                            );
                          }
                        }}
                      >
                        {" "}
                        Half
                      </span>
                    </div>
                    <div className="flex items-center gap-2 border-[2px] px-2 py-[2px] rounded-md">
                      <div className="bg-[#fc4d4d] rounded-full w-[10px] h-[10px] animate-pulse"></div>
                      Base
                    </div>
                  </div>
                }
              />
              <div className="flex justify-center items-center col-span-1 mt-6">
                <CiCirclePlus className="text-[40px]" />
              </div>
              <Input
                isRequired
                type="number"
                radius="sm"
                label="Quote Token Amount:"
                labelPlacement={"outside"}
                placeholder="Put the quote token amount"
                className="col-span-5 h-[40px]"
                min={0}
                value={quoteTokenAmount.toString()}
                onChange={(e) => {
                  setQuoteTokenAmount(Number(e.target.value));
                }}
                endContent={
                  <div className="flex gap-3">
                    <div className="flex gap-2 text-[13px]">
                      <span
                        className="border-[2px] hover:bg-[#eee] px-3 p-1 rounded-2xl cursor-pointer"
                        onClick={() => {
                          if (quoteTokenMeta) {
                            setQuoteTokenAmount(Number(quoteTokenMeta.amount));
                          }
                        }}
                      >
                        {" "}
                        Max
                      </span>
                      <span
                        className="border-[2px] hover:bg-[#eee] px-3 p-1 rounded-2xl cursor-pointer"
                        onClick={() => {
                          if (quoteTokenMeta) {
                            setQuoteTokenAmount(
                              Number(quoteTokenMeta.amount / 2)
                            );
                          }
                        }}
                      >
                        {" "}
                        Half
                      </span>
                    </div>
                    <div className="flex items-center gap-2 border-[2px] px-2 py-[2px] rounded-md">
                      <div className="bg-[#4d5ffc] rounded-full w-[10px] h-[10px] animate-pulse"></div>
                      Quote
                    </div>
                  </div>
                }
              />
            </div>
            <div className="flex justify-center col-span-12 pt-5 w-full">
              <Button
                color="primary"
                isLoading={marketloading || lpLoading}
                fullWidth
                className="text-[18px]"
                onClick={() => {
                  createLP();
                }}
              >
                {marketloading
                  ? "Creating Market"
                  : lpLoading
                  ? "Creating Liquidity Pool"
                  : "Create Liquidity Pool"}
              </Button>
            </div>
          </div>
          <div className=" w-full pt-5 flex items-center gap-5">
            <div className="">
              <Switch
                defaultSelected
                isSelected={isTimeSelected}
                onValueChange={setIsTimeSelected}
                size="sm"
              >
                <span className=" text-[14px]">Set Launch Date</span>
              </Switch>
            </div>
            {isClient && isTimeSelected ? (
              <DatePicker
                className="w-[300px]"
                granularity="second"
                value={date}
                onChange={setDate}
              />
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
