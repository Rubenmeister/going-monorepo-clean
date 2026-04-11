import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

try {
  console.log('Probando conexión a Managed Agents API...');
  const env = await client.beta.environments.create({
    name: 'going-test',
    config: { type: 'cloud', networking: { type: 'unrestricted' } }
  });
  console.log('✅ Environment creado:', env.id);
} catch(e) {
  console.error('Error tipo:', e.constructor.name);
  console.error('Status:', e.status);
  console.error('Mensaje:', e.message);
  if (e.error) console.error('Error body:', JSON.stringify(e.error, null, 2));
}
