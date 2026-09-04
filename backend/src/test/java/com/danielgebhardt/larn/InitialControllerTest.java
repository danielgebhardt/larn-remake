package com.danielgebhardt.larn;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@WebMvcTest
class InitialControllerTest {
    @Autowired
    private MockMvcTester mockMvc;

    @Test
    void shouldReturnHelloWorld() {
        this.mockMvc.get().uri("/initial")
                .exchange()
                .assertThat()
                .hasStatus(HttpStatus.OK)
                .bodyText()
                .isEqualTo("Hello World!");
    }
}