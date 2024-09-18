"use client";

import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import ProSidebar from "@/components/ProSidebar";
import Head from "next/head";
import {
  Input,
  useDisclosure,
  Textarea,
  Switch,
  Button,
} from "@nextui-org/react";
import ImageUploading from "react-images-uploading";
import { FaUpload } from "react-icons/fa6";
import { toast } from "react-toastify";
import {
  useWallet,
  WalletContextState,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import { PINATA_API_KEY } from "@/lib/constant";
import { createToken } from "@/lib/txHandler";
import { solanaConnection, devConnection } from "@/lib/utils";
import { AppContext, uploadJsonToPinata } from "./context/AppContext";

const toastError = (str: string) => {
  toast.error(str, {
    position: "top-center",
  });
};

const toastSuccess = (str: string) => {
  toast.success(str, {
    position: "top-center",
  });
};

const pinataPublicURL = "https://gateway.pinata.cloud/ipfs/";

export default function Home() {
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();

  // console.log("anchorWallet", wallet, anchorWallet);
  const { handleSetMetaData } = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [uploadingStatus, setUploadLoading] = useState(false);
  const [metaDataURL, setMetaDataURL] = useState("");

  // Mint Section
  const [mintTokenName, setMintTokenName] = useState("");
  const [mintTokenSymbol, setTokenSymbol] = useState("");
  const [mintTokenDesc, setMintTokenDesc] = useState("");
  const [mintTokenSupply, setMintTokenSupply] = useState(1);
  const [mintTokenDecimal, setMintTokenDecimal] = useState(6);
  const [socialState, setSocialState] = useState({
    website: "",
    twitter: "",
    telegram: "",
    discord: "",
  });

  const updateState = (key: string, value: string) => {
    setSocialState((prevState: any) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const [images, setImages] = useState<any>([]);
  const [isSelected, setIsSelected] = useState(true);
  const [isIMSelected, setIsIMSelected] = useState(true);
  const [isRFSelected, setIsRFSelected] = useState(true);
  const [isRMSelected, setIsRMSelected] = useState(true);

  const maxNumber = 1;

  const onChange = (imageList: any, addUpdateIndex: any) => {
    // data for submit
    // console.log(imageList, addUpdateIndex);
    setImages(imageList);
  };

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
    return true;
  };

  const tokenCreate = async () => {
    if (!wallet.publicKey) {
      toastError("Wallet not connected!");
      return;
    }
    const validationFlag = await validator();
    if (validationFlag == false) {
      return;
    }

    setLoading(true);

    const imgURL = await handleSetMetaData();
    const uploadedJsonUrl = await uploadJsonToPinata({
      name: mintTokenName,
      symbol: mintTokenSymbol,
      description: mintTokenDesc,
      image: imgURL,
      social_links: socialState,
    });

    const tx = await createToken({
      name: mintTokenName,
      symbol: mintTokenSymbol,
      decimals: mintTokenDecimal,
      url: "devnet",
      metaUri: pinataPublicURL + uploadedJsonUrl,
      initialMintingAmount: mintTokenSupply,
      mintRevokeAuthorities: isRMSelected,
      freezeRevokeAuthorities: isRFSelected,
      mutable: isIMSelected,
      wallet: anchorWallet,
    });
    if (tx) {
      if (anchorWallet) {
        try {
          let stx = (await anchorWallet.signTransaction(tx)).serialize();

          const options = {
            commitment: "confirmed",
            skipPreflight: true,
          };

          const txId = await solanaConnection.sendRawTransaction(stx, options);
          await solanaConnection.confirmTransaction(txId, "confirmed");
          setLoading(false);
          toastSuccess(`${mintTokenName} token created successfully!`);
          console.log("txId======>>", txId);
        } catch (error: any) {
          toastError(`${error.message}`);
          setLoading(false);
        }
      }
    }
    console.log("tx==>>", tx);
  };

  return (
    <main className="flex flex-col gap-5 bg-[#f0f4fd] px-16 py-6 w-full h-screen min-h-screen font-IT text-black">
      <Header />
      <div className="flex gap-6 w-full h-full">
        <ProSidebar />
        <div className="flex flex-col justify-center items-center bg-white p-5 rounded-xl w-full h-full">
          <span className="flex justify-center w-full font-bold text-[25px] text-center">
            Solana Token Creator
          </span>
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
              isRequired
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
            <div className="col-span-12">
              <Switch
                defaultSelected
                isSelected={isSelected}
                onValueChange={setIsSelected}
                size="sm"
              >
                <span className="text-[14px]">Add Social Links</span>
              </Switch>
            </div>
            {isSelected ? (
              <div className="gap-4 grid grid-cols-12 col-span-12">
                <Input
                  type="text"
                  radius="sm"
                  label="Website:"
                  labelPlacement={"outside"}
                  placeholder="Put your website"
                  className="col-span-3 h-[40px]"
                  onChange={(e) => {
                    updateState("website", e.target.value);
                  }}
                />
                <Input
                  type="text"
                  radius="sm"
                  label="Twitter:"
                  labelPlacement={"outside"}
                  placeholder="Put your twitter"
                  className="col-span-3 h-[40px]"
                  onChange={(e) => {
                    updateState("twitter", e.target.value);
                  }}
                />
                <Input
                  type="text"
                  radius="sm"
                  label="Telegram:"
                  labelPlacement={"outside"}
                  placeholder="Put your telegram"
                  className="col-span-3 h-[40px]"
                  onChange={(e) => {
                    updateState("telegram", e.target.value);
                  }}
                />
                <Input
                  type="text"
                  radius="sm"
                  label="Discord:"
                  labelPlacement={"outside"}
                  placeholder="Put your discord"
                  className="col-span-3 h-[40px]"
                  onChange={(e) => {
                    updateState("discord", e.target.value);
                  }}
                />
              </div>
            ) : null}
            <div className="gap-4 grid grid-cols-12 col-span-12">
              <div className="flex justify-start col-span-4">
                <Switch
                  defaultSelected
                  size="sm"
                  className=" "
                  isSelected={isIMSelected}
                  onValueChange={setIsIMSelected}
                >
                  <span className="text-[14px]">Revoke Update (Immutable)</span>
                </Switch>
              </div>
              <div className="flex justify-center col-span-4">
                <Switch
                  defaultSelected
                  size="sm"
                  isSelected={isRFSelected}
                  onValueChange={setIsRFSelected}
                >
                  <span className="text-[14px]">Revoke Freeze</span>
                </Switch>
              </div>
              <div className="flex justify-end col-span-4">
                <Switch
                  defaultSelected
                  size="sm"
                  isSelected={isRMSelected}
                  onValueChange={setIsRMSelected}
                >
                  <span className="text-[14px]">Revoke Mint</span>
                </Switch>
              </div>
            </div>
            <div className="flex justify-center col-span-12 pt-5 w-full">
              <Button
                color="primary"
                fullWidth
                className="text-[18px]"
                onClick={() => {
                  tokenCreate();
                }}
                isLoading={uploadingStatus || loading}
              >
                {uploadingStatus
                  ? "Uploading Metadata"
                  : loading
                  ? "Creating Token"
                  : "Create Token"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
