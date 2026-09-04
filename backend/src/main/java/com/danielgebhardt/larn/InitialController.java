package com.danielgebhardt.larn;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class InitialController {

    @GetMapping("/initial")
    public String initial() {
        return "Hello World!";
    }
}
