-- ============================================================
-- Rellenar TIPO y POBLACION desde full_data
-- Basado en key_tipo + tipos_map.json + código postal
-- ============================================================

-- 1. Actualizar TIPO usando key_tipo mapping
UPDATE property_metadata m
SET
  tipo = CASE
    WHEN (full_data->>'key_tipo')::text = '199' THEN 'Adosado'
    WHEN (full_data->>'key_tipo')::text = '299' THEN 'Bungalow'
    WHEN (full_data->>'key_tipo')::text = '399' THEN 'Casa'
    WHEN (full_data->>'key_tipo')::text = '499' THEN 'Chalet'
    WHEN (full_data->>'key_tipo')::text = '599' THEN 'Cortijo'
    WHEN (full_data->>'key_tipo')::text = '699' THEN 'Hacienda'
    WHEN (full_data->>'key_tipo')::text = '799' THEN 'Inmueble singular'
    WHEN (full_data->>'key_tipo')::text = '899' THEN 'Masía'
    WHEN (full_data->>'key_tipo')::text = '999' THEN 'Pareado'
    WHEN (full_data->>'key_tipo')::text = '1099' THEN 'Torre'
    WHEN (full_data->>'key_tipo')::text = '1199' THEN 'Despacho'
    WHEN (full_data->>'key_tipo')::text = '1299' THEN 'Local comercial'
    WHEN (full_data->>'key_tipo')::text = '1399' THEN 'Oficina'
    WHEN (full_data->>'key_tipo')::text = '1499' THEN 'Albergue'
    WHEN (full_data->>'key_tipo')::text = '1599' THEN 'Almacén'
    WHEN (full_data->>'key_tipo')::text = '1699' THEN 'Edificio'
    WHEN (full_data->>'key_tipo')::text = '1799' THEN 'Fábrica'
    WHEN (full_data->>'key_tipo')::text = '1899' THEN 'Hostal'
    WHEN (full_data->>'key_tipo')::text = '1999' THEN 'Hotel'
    WHEN (full_data->>'key_tipo')::text = '2099' THEN 'Nave industrial'
    WHEN (full_data->>'key_tipo')::text = '2199' THEN 'Amarre'
    WHEN (full_data->>'key_tipo')::text = '2299' THEN 'Bodega'
    WHEN (full_data->>'key_tipo')::text = '2399' THEN 'Garaje'
    WHEN (full_data->>'key_tipo')::text = '2499' THEN 'Lagar'
    WHEN (full_data->>'key_tipo')::text = '2599' THEN 'Parking'
    WHEN (full_data->>'key_tipo')::text = '2699' THEN 'Trastero'
    WHEN (full_data->>'key_tipo')::text = '2799' THEN 'Apartamento'
    WHEN (full_data->>'key_tipo')::text = '2899' THEN 'Ático'
    WHEN (full_data->>'key_tipo')::text = '2999' THEN 'Dúplex'
    WHEN (full_data->>'key_tipo')::text = '3099' THEN 'Estudio'
    WHEN (full_data->>'key_tipo')::text = '3199' THEN 'Habitación'
    WHEN (full_data->>'key_tipo')::text = '3299' THEN 'Loft'
    WHEN (full_data->>'key_tipo')::text = '3399' THEN 'Piso'
    WHEN (full_data->>'key_tipo')::text = '3499' THEN 'Planta baja'
    WHEN (full_data->>'key_tipo')::text = '3599' THEN 'Tríplex'
    WHEN (full_data->>'key_tipo')::text = '3699' THEN 'Finca rústica'
    WHEN (full_data->>'key_tipo')::text = '3799' THEN 'Monte'
    WHEN (full_data->>'key_tipo')::text = '3899' THEN 'Solar'
    WHEN (full_data->>'key_tipo')::text = '3999' THEN 'Terreno industrial'
    WHEN (full_data->>'key_tipo')::text = '4099' THEN 'Terreno rural'
    WHEN (full_data->>'key_tipo')::text = '4199' THEN 'Terreno urbano'
    WHEN (full_data->>'key_tipo')::text = '4399' THEN 'Ático Dúplex'
    WHEN (full_data->>'key_tipo')::text = '4499' THEN 'Negocio'
    WHEN (full_data->>'key_tipo')::text = '4599' THEN 'Casa de campo'
    WHEN (full_data->>'key_tipo')::text = '4699' THEN 'Buhardilla'
    WHEN (full_data->>'key_tipo')::text = '4799' THEN 'Semiatico'
    WHEN (full_data->>'key_tipo')::text = '4899' THEN 'Entresuelo'
    WHEN (full_data->>'key_tipo')::text = '4999' THEN 'Villa'
    WHEN (full_data->>'key_tipo')::text = '5099' THEN 'Parcela'
    WHEN (full_data->>'key_tipo')::text = '5199' THEN 'Quad'
    WHEN (full_data->>'key_tipo')::text = '5299' THEN 'Sótano'
    WHEN (full_data->>'key_tipo')::text = '5399' THEN 'Kiosko'
    WHEN (full_data->>'key_tipo')::text = '5499' THEN 'Bungalow Planta Alta'
    WHEN (full_data->>'key_tipo')::text = '5699' THEN 'Castillo'
    WHEN (full_data->>'key_tipo')::text = '5799' THEN 'Casa Cueva'
    WHEN (full_data->>'key_tipo')::text = '5999' THEN 'Casa de madera'
    WHEN (full_data->>'key_tipo')::text = '6099' THEN 'Caserío'
    WHEN (full_data->>'key_tipo')::text = '6199' THEN 'Casa Solar'
    WHEN (full_data->>'key_tipo')::text = '6299' THEN 'Casa de Pueblo'
    WHEN (full_data->>'key_tipo')::text = '6399' THEN 'Casita Agrícola'
    WHEN (full_data->>'key_tipo')::text = '6499' THEN 'Villa de Lujo'
    WHEN (full_data->>'key_tipo')::text = '6599' THEN 'Casa Terrera'
    WHEN (full_data->>'key_tipo')::text = '6699' THEN 'Pazo'
    WHEN (full_data->>'key_tipo')::text = '6799' THEN 'Camping'
    WHEN (full_data->>'key_tipo')::text = '6899' THEN 'Casa de piedra'
    WHEN (full_data->>'key_tipo')::text = '7099' THEN 'Cabaña'
    WHEN (full_data->>'key_tipo')::text = '7199' THEN 'Cuadra'
    WHEN (full_data->>'key_tipo')::text = '7299' THEN 'Pajar'
    WHEN (full_data->>'key_tipo')::text = '7399' THEN 'Invernadero'
    WHEN (full_data->>'key_tipo')::text = '7499' THEN 'Bungalow Planta Baja'
    WHEN (full_data->>'key_tipo')::text = '7599' THEN 'Casa con terreno'
    WHEN (full_data->>'key_tipo')::text = '7699' THEN 'Barraca'
    WHEN (full_data->>'key_tipo')::text = '7799' THEN 'Bar'
    WHEN (full_data->>'key_tipo')::text = '7899' THEN 'Restaurante'
    WHEN (full_data->>'key_tipo')::text = '7999' THEN 'Cafetería'
    WHEN (full_data->>'key_tipo')::text = '8299' THEN 'Discoteca'
    WHEN (full_data->>'key_tipo')::text = '8699' THEN 'Olivar'
    WHEN (full_data->>'key_tipo')::text = '8799' THEN 'Tierra Calma'
    WHEN (full_data->>'key_tipo')::text = '8899' THEN 'Huerta'
    WHEN (full_data->>'key_tipo')::text = '8999' THEN 'Viñedo'
    WHEN (full_data->>'key_tipo')::text = '9099' THEN 'Terreno urbanizable'
    WHEN (full_data->>'key_tipo')::text = '9199' THEN 'Parking de moto'
    WHEN (full_data->>'key_tipo')::text = '9499' THEN 'Vivienda sobre almacén'
    WHEN (full_data->>'key_tipo')::text = '9599' THEN 'Complejo Turístico'
    WHEN (full_data->>'key_tipo')::text = '9699' THEN 'Piso Único'
    WHEN (full_data->>'key_tipo')::text = '9799' THEN 'Nicho'
    WHEN (full_data->>'key_tipo')::text = '9899' THEN 'Pub'
    WHEN (full_data->>'key_tipo')::text = '9999' THEN 'Molino'
    WHEN (full_data->>'key_tipo')::text = '10099' THEN 'Merendero'
    WHEN (full_data->>'key_tipo')::text = '10199' THEN 'Gasolinera'
    WHEN (full_data->>'key_tipo')::text = '10299' THEN 'Entreplanta'
    WHEN (full_data->>'key_tipo')::text = '10399' THEN 'Campo de Golf'
    WHEN (full_data->>'key_tipo')::text = '10499' THEN 'Vivienda sobre Local'
    WHEN (full_data->>'key_tipo')::text = '10799' THEN 'Semisótano'
    WHEN (full_data->>'key_tipo')::text = '10999' THEN 'Terreno Rústico'
    WHEN (full_data->>'key_tipo')::text = '11099' THEN 'Finca Agrícola'
    WHEN (full_data->>'key_tipo')::text = '11199' THEN 'Finca Ganadera'
    WHEN (full_data->>'key_tipo')::text = '11299' THEN 'Finca Cinegética'
    WHEN (full_data->>'key_tipo')::text = '11399' THEN 'Finca de Recreo'
    WHEN (full_data->>'key_tipo')::text = '11499' THEN 'Almazara'
    WHEN (full_data->>'key_tipo')::text = '11599' THEN 'Hotel Rural'
    WHEN (full_data->>'key_tipo')::text = '11699' THEN 'Casa Rural'
    WHEN (full_data->>'key_tipo')::text = '11799' THEN 'Nave logística'
    WHEN (full_data->>'key_tipo')::text = '11899' THEN 'Finca con Huerto'
    WHEN (full_data->>'key_tipo')::text = '11999' THEN 'Centro Comercial'
    WHEN (full_data->>'key_tipo')::text = '20099' THEN 'Mansión'
    WHEN (full_data->>'key_tipo')::text = '20199' THEN 'Finca Mediterránea'
    WHEN (full_data->>'key_tipo')::text = '20299' THEN 'Alquería'
    WHEN (full_data->>'key_tipo')::text = '20399' THEN 'Coto de Caza'
    WHEN (full_data->>'key_tipo')::text = '20499' THEN 'Riad'
    WHEN (full_data->>'key_tipo')::text = '20599' THEN 'Finca Urbana'
    WHEN (full_data->>'key_tipo')::text = '20699' THEN 'Residencia'
    WHEN (full_data->>'key_tipo')::text = '20899' THEN 'Solar Plurifamiliar'
    WHEN (full_data->>'key_tipo')::text = '20999' THEN 'Sobreático'
    WHEN (full_data->>'key_tipo')::text = '21199' THEN 'Casa Tipo Dúplex'
    WHEN (full_data->>'key_tipo')::text = '21299' THEN 'Caserón'
    WHEN (full_data->>'key_tipo')::text = '21399' THEN 'Palacio'
    ELSE NULL
  END
WHERE full_data IS NOT NULL
  AND (m.tipo IS NULL OR m.tipo = '');

-- 2. Actualizar POBLACION usando código postal mapping
-- Gandía y zona (códigos postales 467xx)
UPDATE property_metadata m
SET
  poblacion = CASE
    WHEN (full_data->>'cp') LIKE '467%' THEN 'Gandía'
    WHEN (full_data->>'cp') = '46700' THEN 'Gandía'
    WHEN (full_data->>'cp') = '46710' THEN 'Oliva'
    WHEN (full_data->>'cp') = '46720' THEN 'Sueca'
    WHEN (full_data->>'cp') = '46730' THEN 'Cullera'
    WHEN (full_data->>'cp') = '46400' THEN 'Cullera'
    WHEN (full_data->>'cp') = '46750' THEN 'Tavernes de la Valldigna'
    WHEN (full_data->>'cp') = '46760' THEN 'Barx'
    WHEN (full_data->>'cp') = '46780' THEN 'Ròtova'
    WHEN (full_data->>'cp') = '46790' THEN 'Benifairó de la Valldigna'
    WHEN (full_data->>'cp') = '46800' THEN 'Xàtiva'
    WHEN (full_data->>'cp') LIKE '468%' THEN 'Xàtiva'
    WHEN (full_data->>'cp') LIKE '46[457]%' THEN 'Zona Gandía'
    ELSE NULL
  END
WHERE full_data IS NOT NULL
  AND (m.poblacion IS NULL OR m.poblacion = '');

-- ============================================================
-- 3. VERIFICACIÓN FINAL
-- ============================================================
SELECT
  COUNT(*) FILTER (WHERE tipo IS NOT NULL AND tipo != '') as con_tipo,
  COUNT(*) FILTER (WHERE tipo IS NULL OR tipo = '') as sin_tipo,
  COUNT(*) FILTER (WHERE poblacion IS NOT NULL AND poblacion != '') as con_poblacion,
  COUNT(*) FILTER (WHERE poblacion IS NULL OR poblacion = '') as sin_poblacion,
  COUNT(*) as total
FROM property_metadata;
