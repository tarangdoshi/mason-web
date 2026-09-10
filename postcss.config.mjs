const config = {plugins: {"@tailwindcss/postcss": {}, "postcss-prefix-selector": {prefix: ".mason-public", includeFiles: [/public\.css$/], transform(prefix, selector, prefixed) {if (selector === ":root" || selector === ":host" || selector === "html" || selector === "body") return prefix; if (selector.startsWith(".mason-public")) return selector; return prefixed;}}}};

export default config;
