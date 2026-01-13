import Header from "@/components/layout/Header";
import Content from "@/components/layout/Content";
import React from "react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Header />
            <Content>
                {children}
            </Content>
        </>
    );
}
