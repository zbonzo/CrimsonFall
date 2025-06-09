import { render, screen } from "@testing-library/react";
import { App } from "@/client/App";

describe("App", () => {
  it("renders main heading", () => {
    render(<App />);
    
    const heading = screen.getByText("Hex Dungeon Crawler");
    expect(heading).toBeInTheDocument();
  });
  
  it("shows coming soon message", () => {
    render(<App />);
    
    const message = screen.getByText("Game setup coming soon...");
    expect(message).toBeInTheDocument();
  });
});
