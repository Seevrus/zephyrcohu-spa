import { Component, inject, signal } from "@angular/core";
import {
  email as emailValidator,
  form,
  FormField,
  required,
  submit,
} from "@angular/forms/signals";
import { MatOption } from "@angular/material/core";
import { MatError, MatFormField, MatLabel } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { MatSelect } from "@angular/material/select";
import { injectMutation } from "@tanstack/angular-query-experimental";

import { ZephyrHttpError } from "../../../api/ZephyrHttpError";
import {
  OFFER_REQUEST_SUBJECT_OPTIONS,
  type RequestOfferRequest,
} from "../../../types/offerRequest";
import { ButtonLoadableComponent } from "../../components/button-loadable/button-loadable.component";
import { FormUnexpectedErrorComponent } from "../../components/form-alerts/form-unexpected-error/form-unexpected-error.component";
import { RequestQuoteSuccessComponent } from "../../components/form-alerts/request-quote-success/request-quote-success.component";
import { OffersQueryService } from "../../services/offers.query.service";

@Component({
  selector: "app-request-quote",
  host: {
    class: "app-request-quote",
  },
  imports: [
    ButtonLoadableComponent,
    FormField,
    FormUnexpectedErrorComponent,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    MatOption,
    MatSelect,
    RequestQuoteSuccessComponent,
  ],
  templateUrl: "./request-quote.component.html",
  styleUrl: "./request-quote.component.scss",
})
export class RequestQuoteComponent {
  private readonly offersQueryService = inject(OffersQueryService);

  protected readonly subjectOptions = OFFER_REQUEST_SUBJECT_OPTIONS;

  /**
   * INTERNAL_SERVER_ERROR
   */
  protected readonly errorMessage = signal("");
  protected readonly success = signal(false);

  private readonly requestOfferModel = signal<RequestOfferRequest>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  protected readonly requestOfferForm = form(
    this.requestOfferModel,
    (schemaPath) => {
      required(schemaPath.name);
      required(schemaPath.email);
      emailValidator(schemaPath.email);
      required(schemaPath.subject);
      required(schemaPath.message);
    },
  );

  protected readonly requestOfferMutation = injectMutation(() =>
    this.offersQueryService.requestOffer(),
  );

  async onSubmit(event: Event) {
    event.preventDefault();

    await submit(this.requestOfferForm, async () => {
      try {
        this.errorMessage.set("");
        this.success.set(false);

        const { name, email, subject, message } = this.requestOfferModel();

        await this.requestOfferMutation.mutateAsync({
          name,
          email,
          subject,
          message,
        });

        this.success.set(true);
        this.requestOfferModel.set({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
      } catch (error) {
        if (error instanceof ZephyrHttpError) {
          this.errorMessage.set(error.code);
        } else {
          this.errorMessage.set("INTERNAL_SERVER_ERROR");
        }
      }
    });
  }
}
