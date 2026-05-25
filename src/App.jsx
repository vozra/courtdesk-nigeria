import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export default function App() {
  const [status, setStatus] = useState("Checking Supabase...");

  useEffect(() => {
    supabase
      .from("matters")
      .select("count")
      .then(({ data, error }) => {
        if (error) {
          setStatus("Supabase error: " + error.message);
        } else {
          setStatus("Supabase connected! ✅ Ready to load full app.");
        }
      });
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#040c18",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Georgia, serif",
      color: "#e8dcc8",
      flexDirection: "column",
      gap: 16
    }}>
      <div style={{ fontSize: 48 }}>⚖</div>
      <div style={{
        color: "#c9a84c",
        fontSize: 24,
        fontWeight: 700
      }}>
        CourtDesk Nigeria
      </div>
      <div style={{ color: "#5a7a9a", fontSize: 14 }}>{status}</div>
    </div>
  );
}