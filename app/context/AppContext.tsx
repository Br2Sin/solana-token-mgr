"use client";
import {
  AnchorWallet,
  useAnchorWallet,
  useWallet,
  WalletContextState,
} from "@solana/wallet-adapter-react";
import React, { createContext, useState, useContext, ReactNode } from "react";
import { PINATA_API_KEY } from "@/lib/constant";
import { toast } from "react-toastify";

// Define the shape of the context state
export interface AppContextType {
  state: string;
  updateState: (newState: string) => void;
  handleSetMetaData: () => any;
  uploadingStatus: boolean;
  setUploadLoading: (input: boolean) => void;
  images: any;
  setImages: (input: any) => void;
  metaDataURL: string;
  setMetaDataURL: (input: string) => void;
}

const pinataPublicURL = "https://gateway.pinata.cloud/ipfs/";

// Create the context with a default value
export const AppContext = createContext<AppContextType>({
  state: "",
  updateState: () => {},
  handleSetMetaData: () => {},
  uploadingStatus: false,
  setUploadLoading: () => {},
  images: [],
  setImages: () => {},
  metaDataURL: "",
  setMetaDataURL: () => {},
});

// Create the provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<string>("initial state");

  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();
  const [uploadingStatus, setUploadLoading] = useState(false);
  const [images, setImages] = useState<any>([]);
  const [metaDataURL, setMetaDataURL] = useState("");

  const updateState = (newState: string) => {
    setState(newState);
  };

  const handleSetMetaData = async () => {
    setUploadLoading(true);
    const data = images.length > 0 ? images[0].file : null;
    const imgData = new FormData();
    imgData.append("file", data);

    const imgRes = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_API_KEY}`,
        },
        body: imgData,
      }
    );

    const imgJsonData = await imgRes.json();

    setMetaDataURL(pinataPublicURL + imgJsonData.IpfsHash);
    setUploadLoading(false);
    // setLoading(true);
    return pinataPublicURL + imgJsonData.IpfsHash;
  };

  return (
    <AppContext.Provider
      value={{
        state,
        updateState,
        handleSetMetaData,
        uploadingStatus,
        setUploadLoading,
        images,
        setImages,
        metaDataURL,
        setMetaDataURL,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// // Create a custom hook to use the context
// export const useAppContext = (): AppContextType => {
//   const context = useContext(AppContext);
//   if (context === undefined) {
//     throw new Error("useAppContext must be used within an AppProvider");
//   }
//   return context;
// };

export const toastError = (str: string) => {
  toast.error(str, {
    position: "top-center",
  });
};

export const toastSuccess = (str: string) => {
  toast.success(str, {
    position: "top-center",
    autoClose: false,
  });
};

export const uploadJsonToPinata = async (jsonData: any) => {
  try {
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          // Replace YOUR_PINATA_JWT with your actual JWT token
          Authorization: `Bearer ${PINATA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pinataContent: jsonData,
        }),
      }
    );
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }
    const data = await response.json();
    console.log("Uploaded JSON hash:", data.IpfsHash);
    return data.IpfsHash;
  } catch (error) {
    console.error("Error uploading JSON to Pinata:", error);
    throw error;
  }
};
