// next.config.mjs
import { withNetlify } from '@netlify/plugin-nextjs';

const nextConfig = {
  reactStrictMode: true,
};

export default withNetlify(nextConfig);
