import express from "express";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);


// Estado de la API
app.get("/", (req, res) => {
  res.json({
    online: true,
    message: "API funcionando"
  });
});


// Ver datos de prueba
app.get("/data", async (req, res) => {

  const { data, error } = await supabase
    .from("licenses")
    .select("*");

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json(data);
});


// Verificar licencia
app.post("/verify-license", async (req, res) => {

  try {

    const { key, device_id } = req.body;


    if (!key) {
      return res.json({
        valid: false,
        msg: "Falta la key"
      });
    }


    const { data, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", key)
      .single();


    if (error || !data) {
      return res.json({
        valid: false,
        msg: "Key no existe"
      });
    }


    if (!data.active) {
      return res.json({
        valid: false,
        msg: "Key bloqueada"
      });
    }


    if (data.expires_at) {

      const fecha = new Date(data.expires_at);
      const ahora = new Date();

      if (fecha < ahora) {
        return res.json({
          valid: false,
          expired: true,
          msg: "Key expirada"
        });
      }

    }


    // Guardar dispositivo la primera vez
    if (!data.device_id) {

      await supabase
        .from("licenses")
        .update({
          device_id: device_id
        })
        .eq("id", data.id);

    }


    else if (data.device_id !== device_id) {

      return res.json({
        valid: false,
        msg: "Key usada en otro dispositivo"
      });

    }


    return res.json({
      valid: true,
      msg: "Key válida"
    });


  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});



const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
  console.log("Servidor iniciado en puerto " + PORT);
});