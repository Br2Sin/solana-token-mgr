"use client";

import { useState, useEffect, useContext } from "react";
import Header from "@/components/Header";
import ProSidebar from "@/components/ProSidebar";
import { Button, Input, Switch, Textarea } from "@nextui-org/react";
import SimpleBar from "simplebar-react";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import ImageUploading from "react-images-uploading";
import { FaUpload } from "react-icons/fa6";
import { toast } from "react-toastify";
import { PublicKey } from "@solana/web3.js";
import { createTaxToken } from "@/lib/txHandler";
import { solanaConnection } from "@/lib/utils";
import { PINATA_API_KEY } from "@/lib/constant";
import {
  AppContext,
  toastError,
  toastSuccess,
  uploadJsonToPinata,
} from "../context/AppContext";

export default function Home() {
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();

  const [loading, setLoading] = useState(false);
  const [uploadingStatus, setUploadLoading] = useState(false);
  const { handleSetMetaData } = useContext(AppContext);

  // Mint Section
  const [mintTokenName, setMintTokenName] = useState("");
  const [mintTokenSymbol, setTokenSymbol] = useState("");
  const [mintTokenDesc, setMintTokenDesc] = useState("");
  const [mintTokenSupply, setMintTokenSupply] = useState(1);
  const [mintTokenDecimal, setMintTokenDecimal] = useState(6);
  const [txFee, setTxFee] = useState(0);
  const [maxFee, setMaxFee] = useState(0);
  const [authWallet, setAuthWallet] = useState("");
  const [withdrawWallet, setWithdrawWallet] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [bearingRate, setBearingRate] = useState(0);
  const [metaDataURL, setMetaDataURL] = useState("");

  const [images, setImages] = useState([]);
  const [isSelected, setIsSelected] = useState(false);
  const [isTranserSelected, setIsTransferSelected] = useState(false);

  const maxNumber = 1;

  const onChange = (imageList: any, addUpdateIndex: any) => {
    // data for submit
    console.log(imageList, addUpdateIndex);
    setImages(imageList);
  };

  const pinataPublicURL = "https://gateway.pinata.cloud/ipfs/";

  const validator = async () => {
    if (!mintTokenName) {
      toastError("Please enter the token name");
      return false;
    }
    if (!mintTokenSymbol) {
      toastError("Please enter the token symbol");
      return false;
    }
    if (mintTokenDecimal <= 0) {
      toastError("Please enter a valid token decimal");
      return false;
    }
    if (mintTokenSupply <= 0) {
      toastError("Please enter a valid token supply");
      return false;
    }
    if (images.length === 0) {
      toastError("Please upload the token logo");
      return false;
    }
    if (!mintTokenDesc) {
      toastError("Please enter the token description");
      return false;
    }
    if (txFee < 0 || txFee >= 100) {
      toastError("Please select correct fee rate.");
      return false;
    }
    return true;
  };

  const createToken = async () => {
    if (!wallet.publicKey) {
      toastError("Wallet not connected!");
      return;
    }
    const validationFlag = await validator();
    if (validationFlag == false) {
      return;
    }

    const imgURL = await handleSetMetaData();
    const uploadedJsonUrl = await uploadJsonToPinata({
      name: mintTokenName,
      symbol: mintTokenSymbol,
      description: mintTokenDesc,
      image: imgURL,
    });

    setLoading(true);

    let permanentWallet: any;
    if (isSelected) {
      permanentWallet = new PublicKey(permanentAddress);
    } else {
      permanentWallet = "";
    }

    const res = await createTaxToken({
      name: mintTokenName,
      symbol: mintTokenSymbol,
      decimals: mintTokenDecimal,
      url: "devnet",
      metaUri: pinataPublicURL + uploadedJsonUrl,
      initialMintingAmount: mintTokenSupply,
      feeRate: txFee,
      maxFee,
      authWallet: new PublicKey(authWallet),
      withdrawWallet: new PublicKey(withdrawWallet),
      useExtenstion: isSelected,
      permanentWallet,
      defaultAccountState: 1,
      bearingRate,
      transferable: isTranserSelected,
      wallet: anchorWallet,
    });
    if (res) {
      if (anchorWallet) {
        try {
          let stx = (
            await anchorWallet.signTransaction(res.mintTransaction)
          ).serialize();

          const options = {
            commitment: "confirmed",
            skipPreflight: true,
          };

          const txId = await solanaConnection.sendRawTransaction(stx, options);
          await solanaConnection.confirmTransaction(txId, "confirmed");
          setLoading(false);
          toastSuccess(`${res.mint.toBase58()} token created successfully!`);
          console.log("txId======>>", txId);
        } catch (error: any) {
          toastError(`${error.message}`);
          setLoading(false);
        }
      }
    }
  };

  return (
    <main
      className={`flex flex-col min-h-screen px-16 py-6 bg-[#f0f4fd] font-IT w-full gap-5 h-screen text-black`}
    >
      <Header />
      <div className="flex gap-6 w-full h-full">
        <ProSidebar />
        <div className="flex flex-col justify-center items-center bg-white p-5 rounded-xl w-full h-full">
          <span className="flex justify-center w-full font-bold text-[25px] text-center">
            {" "}
            Tax Token Creator
          </span>
          <SimpleBar
            forceVisible="x"
            autoHide={true}
            className="px-6 w-full h-[700px]"
          >
            <div className="gap-6 grid grid-cols-12 pt-10 w-full">
              <Input
                isRequired
                type="text"
                radius="sm"
                label="Name:"
                labelPlacement={"outside"}
                placeholder="Put the name of your token"
                className="col-span-6 h-[40px]"
                onChange={(e) => {
                  setMintTokenName(e.target.value);
                }}
              />
              <Input
                isRequired
                type="text"
                radius="sm"
                label="Symbol:"
                labelPlacement={"outside"}
                className="col-span-6 h-[40px]"
                placeholder="Put the symbol of your token"
                onChange={(e) => {
                  setTokenSymbol(e.target.value);
                }}
              />
              <Input
                isReadOnly
                type="number"
                radius="sm"
                defaultValue="6"
                label="Decimals:"
                labelPlacement={"outside"}
                className="col-span-6 h-[40px]"
                onChange={(e) => {
                  setMintTokenDecimal(Math.floor(Number(e.target.value)));
                }}
              />
              <Input
                isRequired
                type="number"
                radius="sm"
                defaultValue="1"
                label="Supply:"
                labelPlacement={"outside"}
                className="col-span-6 h-[40px]"
                onChange={(e) => {
                  setMintTokenSupply(Math.floor(Number(e.target.value)));
                }}
              />
              <div className="flex flex-col gap-[6px] col-span-6 h-[225px] font-normal text-[14px]">
                <span>Image:</span>
                <ImageUploading
                  multiple
                  value={images}
                  onChange={onChange}
                  maxNumber={maxNumber}
                  dataURLKey="data_url"
                >
                  {({
                    imageList,
                    onImageUpload,
                    onImageRemoveAll,
                    onImageUpdate,
                    onImageRemove,
                    isDragging,
                    dragProps,
                  }) => (
                    // write your building UI
                    <div className="w-full h-full upload__image-wrapper">
                      {/* <button onClick={onImageRemoveAll}>Remove all images</button> */}
                      {imageList.length > 0 ? (
                        imageList.map((image, index) => (
                          <div
                            key={index}
                            className="flex flex-col justify-center items-center w-full image-item"
                          >
                            <img
                              src={image["data_url"]}
                              alt=""
                              className="rounded-xl w-[150px] h-[150px] object-center"
                            />
                            <div className="flex justify-center gap-[60px] w-full image-item__btn-wrapper">
                              <button
                                onClick={() => onImageUpdate(index)}
                                className="hover:text-[#5680ce]"
                              >
                                Update
                              </button>
                              <button
                                onClick={() => onImageRemove(index)}
                                className="hover:text-[#5680ce]"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <button
                          style={isDragging ? { color: "red" } : undefined}
                          onClick={onImageUpload}
                          className="flex flex-col justify-center items-center gap-3 bg-[#eee] rounded-xl w-full h-full"
                          {...dragProps}
                        >
                          <FaUpload fontSize={25} />
                          Click or Drop here
                        </button>
                      )}
                    </div>
                  )}
                </ImageUploading>
                <span className="text-[12px]">
                  Most meme coin use a squared 1000x1000 logo
                </span>
              </div>
              <div className="col-span-6 w-full h-[200px]">
                <Textarea
                  isRequired
                  fullWidth
                  classNames={{
                    innerWrapper: "h-[157px]",
                  }}
                  maxRows={8}
                  label="Description"
                  labelPlacement="outside"
                  placeholder="Enter your description"
                  onChange={(e) => {
                    setMintTokenDesc(e.target.value);
                  }}
                />
              </div>
              <Input
                isRequired
                type="number"
                radius="sm"
                label="Fee %: (10 = 10% per transaction):"
                placeholder="Put fee"
                labelPlacement={"outside"}
                className="col-span-6 h-[40px]"
                min={0}
                max={99.9}
                defaultValue="0"
                onChange={(e) => {
                  setTxFee(Number(e.target.value));
                }}
              />
              <Input
                isRequired
                type="number"
                radius="sm"
                defaultValue="0 "
                label="Max Fee: (the maximum fee an user can pay in tokens):"
                placeholder="Put fee"
                labelPlacement={"outside"}
                className="col-span-6 h-[40px]"
                onChange={(e) => {
                  setMaxFee(Number(e.target.value));
                }}
              />
              <Input
                isRequired
                type="text"
                radius="sm"
                label="Authority Wallet:"
                placeholder="Wallet Address"
                labelPlacement={"outside"}
                className="col-span-6 h-[40px]"
                onChange={(e) => {
                  setAuthWallet(e.target.value);
                }}
              />
              <Input
                isRequired
                type="text"
                radius="sm"
                label="Withdraw Authority: (wallet to withdraw fees):"
                placeholder="Wallet Address"
                labelPlacement={"outside"}
                className="col-span-6 h-[40px]"
                onChange={(e) => {
                  setWithdrawWallet(e.target.value);
                }}
              />
              <div className="col-span-12">
                <Switch
                  defaultSelected
                  isSelected={isSelected}
                  onValueChange={setIsSelected}
                  size="sm"
                >
                  <span className="text-[14px]">Use Extensions</span>
                </Switch>
              </div>
              {isSelected ? (
                <div className="gap-4 grid grid-cols-12 col-span-12">
                  <Input
                    type="text"
                    radius="sm"
                    label="Permanent Delegate:"
                    labelPlacement={"outside"}
                    placeholder="Permanent address"
                    className="col-span-4 h-[40px]"
                    onChange={(e) => {
                      setPermanentAddress(e.target.value);
                    }}
                  />
                  <Input
                    type="text"
                    radius="sm"
                    label="Default Account State:"
                    labelPlacement={"outside"}
                    placeholder="initialized"
                    className="col-span-2 h-[40px]"
                    isReadOnly
                  />
                  <Input
                    type="number"
                    radius="sm"
                    label="Interest Bearing Rate:"
                    labelPlacement={"outside"}
                    defaultValue="0"
                    placeholder="Put the rate"
                    className="col-span-4 h-[40px]"
                    onChange={(e) => {
                      setBearingRate(Number(e.target.value));
                    }}
                  />
                  <div className="flex justify-end items-end col-span-2 h-full">
                    <Switch
                      defaultSelected
                      isSelected={isTranserSelected}
                      onValueChange={setIsTransferSelected}
                      size="sm"
                    >
                      <span className="text-[14px]">Non-Transferable</span>
                    </Switch>
                  </div>
                </div>
              ) : null}
              <div className="flex justify-center col-span-12 pt-5 w-full">
                <Button
                  color="primary"
                  fullWidth
                  className="text-[18px]"
                  onClick={() => {
                    createToken();
                  }}
                  isLoading={uploadingStatus || loading}
                >
                  {uploadingStatus
                    ? "Uploading Metadata"
                    : loading
                    ? "Creating Tax Token"
                    : "Create Tax Token"}
                </Button>
              </div>
            </div>
          </SimpleBar>
        </div>
      </div>
    </main>
  );
}
