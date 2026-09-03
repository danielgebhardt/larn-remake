import {describe, expect, it} from 'vitest'
import App from "../App.tsx";
import {render, screen} from "@testing-library/react";

describe('App', () => {
    it('should render the App component', () => {
        render(<App/>);

        expect(screen.getByText("Get started")).toBeInTheDocument();
    });
})

