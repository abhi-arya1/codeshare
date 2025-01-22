import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypePrism from "rehype-prism-plus";
import rehypeRaw from "rehype-raw";

const MarkdownRenderer = ({ content }: { content: string }) => {
    return (
        <div className="max-w-none w-full text-black dark:text-white">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    h1: (props) => (
                        <h1
                            className="text-4xl mb-6 mt-8"
                            {...props}
                        />
                    ),
                    h2: (props) => (
                        <h2
                            className="text-3xl mb-4 mt-8 pb-2 border-b border-gray-200"
                            {...props}
                        />
                    ),
                    h3: (props) => (
                        <h3
                            className="text-2xl mb-3 mt-6"
                            {...props}
                        />
                    ),
                    h4: (props) => (
                        <h3
                            className="text-xl mb-3 mt-6"
                            {...props}
                        />
                    ),
                    p: (props) => (
                        <p
                            className="text-lg leading-relaxed mb-4"
                            {...props}
                        />
                    ),
                    ul: (props) => (
                        <ul
                            className="list-disc list-inside mb-4 space-y-2"
                            {...props}
                        />
                    ),
                    ol: (props) => (
                        <ol
                            className="list-decimal list-inside mb-4 space-y-2"
                            {...props}
                        />
                    ),
                    li: (props) => (
                        <li className="text-lg text-gray-800" {...props} />
                    ),
                    blockquote: (props) => (
                        <blockquote
                            className="border-l-4 border-[#1A8B7E] pl-4 italic my-4"
                            {...props}
                        />
                    ),
                    a: (props) => (
                        <a
                            className="text-[#1A8B7E] hover:underline"
                            {...props}
                        />
                    ),
                    code: ({ className, children, inline, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || "");
                        return (
                            <code
                                className="px-1.5 py-0.5 text-sm bg-gray-300 rounded text-gray-900 font-mono"
                                {...props}
                            >
                                {children}
                            </code>
                        );
                        // return (
                        //     <pre className="bg-gray-900 text-white rounded-lg p-4 my-4 overflow-x-auto">
                        //         <code
                        //             className={match ? `language-${match[1]}` : "language-text"}
                        //             {...props}
                        //         >
                        //             {children}
                        //         </code>
                        //     </pre>
                        // );
                    },
                    img: (props) => (
                        <img
                            className="rounded-lg max-w-full my-4 shadow-sm"
                            {...props}
                        />
                    ),
                    hr: (props) => (
                        <hr
                            className="my-8 border-t border-gray-200"
                            {...props}
                        />
                    ),
                    table: (props) => (
                        <div className="overflow-x-auto my-4">
                            <table
                                className="min-w-full divide-y divide-gray-200"
                                {...props}
                            />
                        </div>
                    ),
                    th: (props) => (
                        <th
                            className="px-6 py-3 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider"
                            {...props}
                        />
                    ),
                    td: (props) => (
                        <td
                            className="px-6 py-4 whitespace-nowrap text-sm"
                            {...props}
                        />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;