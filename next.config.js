module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/proxy',
        destination: 'https://sand-ionized-pine.glitch.me' // Replace with your Glitch project URL
      }
    ];
  }
};
