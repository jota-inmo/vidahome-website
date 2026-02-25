import { createClient } from "@supabase/supabase-js";

async function main() {
  const supabase = createClient(
    'https://yovyghuohftmqncwrjxp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdnlnaHVvaGZ0bXFuY3dyanhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4Nzc4NzcsImV4cCI6MjA0ODQ1Mzg3N30.sL--2u97dVqOg87qG8jQR8CQnVVGV9YPXJpZWZOhDoU'
  );

  const props = [27021782, 26286790, 26547933, 27260682, 26286569];

  for (const cod of props) {
    const { data } = await supabase
      .from('property_metadata')
      .select('descriptions, full_data')
      .eq('cod_ofer', cod)
      .single();

    const espaniol = data?.descriptions?.description_es || data?.full_data?.descripciones || '';
    const es_length = espaniol?.length || 0;
    console.log(`${cod}: ${es_length} chars - ${espaniol.substring(0, 80)}...`);
  }
}

main().catch(console.error);
