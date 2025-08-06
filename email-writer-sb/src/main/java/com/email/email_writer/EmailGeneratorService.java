package com.email.email_writer;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClient.RequestBodySpec;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class EmailGeneratorService {
	private final WebClient webClient;
	
	@Value("${gemini.api.url}")
	private String geminiApiUrl;
	@Value("${gemini.api.key}")
	private String geminiApiKey;	
	public EmailGeneratorService(WebClient.Builder webClientBuilder)
	{
		this.webClient= webClientBuilder.build();
	}
	public String generateEmailReply(EmailRequest emailRequest)
	{
		String prompt= buildPrompt(emailRequest);
		Map<String,Object> requestBody = Map.of(
				"contents",new Object[] {
Map.of("parts", new Object[] {
		Map.of("text", prompt)
})
				});
		String response= webClient.post().uri( geminiApiUrl + geminiApiKey)
				.header("Content-type", "application/json")
				.bodyValue(requestBody)
				.retrieve()
				.bodyToMono(String.class)
				.block();
		
				return extractResponseContent(response); 
	}


	private String extractResponseContent(String response)
 {
		// TODO Auto-generated method stub
		try {
			ObjectMapper mapper= new ObjectMapper();
			JsonNode rootNode= mapper.readTree(response);
			return rootNode.path("candidates")
					.get(0)
					.path("content")
					.path("parts")
					.get(0)
					.path("text")
					.asText();
		}
		catch(Exception e){
			return "Error processing request:" + e.getMessage();
		}
 }
	
	private String buildPrompt(EmailRequest emailRequest) {
		// TODO Auto-generated method stub
		StringBuilder prompt= new StringBuilder();
		prompt.append("Generate a professional reply for the following Email content.Please dont genrate a subject line ");
		if (emailRequest.getTone() != null && !emailRequest.getTone().isEmpty()) {
			prompt.append("Use a").append(emailRequest.getTone()).append(" tone. ");
		}
		prompt.append("\nOriginal email:\n").append(emailRequest.getEmailContent());
		return prompt.toString();

	}
}
