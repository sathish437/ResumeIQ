package com.example.ResumeIQ;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ResumeIqApplication {

	public static void main(String[] args) {
		com.example.ResumeIQ.config.DotenvLoader.load();
		SpringApplication.run(ResumeIqApplication.class, args);
	}

}
