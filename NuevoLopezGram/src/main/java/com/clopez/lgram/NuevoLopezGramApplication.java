package com.clopez.lgram;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class NuevoLopezGramApplication {

	public static void main(String[] args) {
		SpringApplication.run(NuevoLopezGramApplication.class, args);
	}

}
